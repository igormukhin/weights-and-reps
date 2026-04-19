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
import { enforceRowInvariants } from '@/utils/setRowInvariants'
import { useSessionStore } from '@/stores/session'

export function useSession(uid: string, exerciseId: string) {
  const sessionStore = useSessionStore()

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
  // Cache sync
  // ---------------------------------------------------------------------------
  function syncToCache(): void {
    sessionStore.set(exerciseId, {
      date: todayISO(),
      hasTodaySession: hasTodaySession.value,
      isSessionPersisted: isSessionPersisted.value,
      todaySets: todaySets.value.map((s) => ({ ...s })),
      lastSets: lastSets.value,
      lastSessionDate: lastSessionDate.value,
    })
  }

  // ---------------------------------------------------------------------------
  // Init: load today's session and last session on mount
  // ---------------------------------------------------------------------------
  async function init(): Promise<void> {
    const today = todayISO()

    // Serve from cache if available (same calendar day)
    const cached = sessionStore.get(exerciseId, today)
    if (cached) {
      hasTodaySession.value = cached.hasTodaySession
      isSessionPersisted.value = cached.isSessionPersisted
      todaySets.value = cached.todaySets.map((s) => ({ ...s }))
      lastSets.value = cached.lastSets
      lastSessionDate.value = cached.lastSessionDate
      if (hasTodaySession.value) {
        enforceRowInvariants(todaySets.value)
        syncToCache()
      }
      isLoading.value = false
      return
    }

    // Cache miss — fetch from Firestore
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
      todaySets.value = todaySession.sets.map((s) => ({ ...s }))
      enforceRowInvariants(todaySets.value)
    } else {
      hasTodaySession.value = false
      isSessionPersisted.value = false
      todaySets.value = []
    }

    syncToCache()
  }

  // ---------------------------------------------------------------------------
  // Start a new session: pre-fill from last session, enter edit mode.
  // Session is NOT written to Firestore yet — that happens on first data entry.
  // ---------------------------------------------------------------------------
  function startSession(): void {
    todaySets.value = lastSets.value.length > 0
      ? lastSets.value.map((s) => ({ ...s }))
      : []
    enforceRowInvariants(todaySets.value)
    hasTodaySession.value = true
    isSessionPersisted.value = false
    syncToCache()
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
    enforceRowInvariants(todaySets.value)
    syncToCache()
    scheduleSave()
  }

  function toggleBumpIt(index: number): void {
    const set = { ...todaySets.value[index] }
    set.bumpIt = !set.bumpIt
    todaySets.value[index] = set
    syncToCache()
    scheduleSave()
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
    syncToCache()
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
      (s): s is Set => s.weight !== undefined,
    )

    // All inputs empty — delete persisted session, or skip if not yet saved
    if (validSets.length === 0) {
      if (isSessionPersisted.value) {
        saveStatus.value = 'saving'
        saveError.value = null
        try {
          await deleteSessionService(uid, exerciseId, todayISO())
          isSessionPersisted.value = false
          saveStatus.value = 'saved'
          syncToCache()
        } catch (e) {
          saveStatus.value = 'error'
          saveError.value = 'Failed to save. Check your connection.'
          console.error(e)
        }
      }
      return
    }

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
      syncToCache()
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
    toggleBumpIt,
    deleteSession,
  }
}
