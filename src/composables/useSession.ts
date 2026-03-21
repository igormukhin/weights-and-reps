import { ref } from 'vue'
import type { Ref } from 'vue'
import type { Set, SaveStatus } from '@/types'
import {
  getTodaySession,
  getLastSession,
  saveSession,
  deleteSession as deleteSessionService,
} from '@/services/sessions'
import { todayISO, formatGermanDate } from '@/utils/date'

export function useSession(uid: string, exerciseId: string) {
  const isLoading = ref(true)
  const hasTodaySession = ref(false)
  const isSessionPersisted = ref(false)
  const todaySets = ref<Partial<Set>[]>([])
  const lastSets = ref<Set[]>([])
  const lastSessionDate = ref('')
  const saveStatus = ref<SaveStatus>('idle')
  const saveError = ref<string | null>(null)

  let saveTimer: ReturnType<typeof setTimeout> | null = null

  // ---------------------------------------------------------------------------
  // Init: load today's session and last session on mount
  // ---------------------------------------------------------------------------
  async function init(): Promise<void> {
    const today = todayISO()
    const [todaySession, lastSession] = await Promise.all([
      getTodaySession(uid, exerciseId, today),
      getLastSession(uid, exerciseId, today),
    ])

    lastSets.value = lastSession?.sets ?? []
    lastSessionDate.value = lastSession ? formatGermanDate(lastSession.date) : ''

    isLoading.value = false

    if (todaySession) {
      hasTodaySession.value = true
      isSessionPersisted.value = true
      const loaded = todaySession.sets.map((s) => ({ ...s }))
      todaySets.value = loaded.length < 3
        ? [...loaded, ...Array.from({ length: 3 - loaded.length }, () => ({}))]
        : loaded
    } else {
      hasTodaySession.value = false
      isSessionPersisted.value = false
      todaySets.value = []
    }
  }

  // ---------------------------------------------------------------------------
  // Start a new session: pre-fill from last session, enter edit mode.
  // Session is NOT written to Firestore yet — that happens on first data entry.
  // ---------------------------------------------------------------------------
  function startSession(): void {
    todaySets.value = lastSets.value.length > 0
      ? lastSets.value.map((s) => ({ ...s }))
      : Array.from({ length: 3 }, () => ({}))
    hasTodaySession.value = true
    isSessionPersisted.value = false
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  function updateSet(index: number, field: 'weight' | 'reps', value: number | null): void {
    const set = { ...todaySets.value[index] }
    if (value === null) {
      delete set[field]
    } else {
      set[field] = value
    }
    todaySets.value[index] = set
    scheduleSave()
  }

  function addSet(): void {
    todaySets.value.push({})
  }

  // ---------------------------------------------------------------------------
  // Delete today's session
  // ---------------------------------------------------------------------------
  async function deleteSession(): Promise<void> {
    // Cancel any pending debounced save so it doesn't fire after deletion
    if (saveTimer !== null) {
      clearTimeout(saveTimer)
      saveTimer = null
    }

    if (isSessionPersisted.value) {
      try {
        await deleteSessionService(uid, exerciseId, todayISO())
      } catch (e) {
        saveStatus.value = 'error'
        saveError.value = 'Failed to delete. Check your connection.'
        console.error(e)
        return
      }
    }

    hasTodaySession.value = false
    isSessionPersisted.value = false
    todaySets.value = []
    saveStatus.value = 'idle'
  }

  // ---------------------------------------------------------------------------
  // Auto-save (2-second debounce)
  // ---------------------------------------------------------------------------
  function scheduleSave(): void {
    if (saveTimer !== null) clearTimeout(saveTimer)
    saveStatus.value = 'idle'
    saveTimer = setTimeout(() => {
      void persist()
    }, 2000)
  }

  /** Cancel any pending debounced save and persist immediately. Call on navigation away. */
  function flushSave(): void {
    if (saveTimer !== null) {
      clearTimeout(saveTimer)
      saveTimer = null
      void persist()
    }
  }

  async function persist(): Promise<void> {
    const validSets = todaySets.value.filter(
      (s): s is Set =>
        s.weight !== undefined &&
        s.weight >= 0.5,
    )

    saveStatus.value = 'saving'
    saveError.value = null

    try {
      await saveSession(uid, exerciseId, {
        exerciseId,
        date: todayISO(),
        sets: validSets,
      })
      saveStatus.value = 'saved'
      isSessionPersisted.value = true
    } catch (e) {
      saveStatus.value = 'error'
      saveError.value = 'Failed to save. Check your connection.'
      console.error(e)
    }
  }

  return {
    isLoading: isLoading as Ref<boolean>,
    hasTodaySession: hasTodaySession as Ref<boolean>,
    isSessionPersisted: isSessionPersisted as Ref<boolean>,
    todaySets: todaySets as Ref<Partial<Set>[]>,
    lastSets,
    lastSessionDate,
    saveStatus,
    saveError,
    init,
    flushSave,
    startSession,
    updateSet,
    addSet,
    deleteSession,
  }
}
