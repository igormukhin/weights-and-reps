import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { Set, SaveStatus } from '@/types'
import { getTodaySession, getLastSession, saveSession } from '@/services/sessions'
import { todayISO, formatGermanDate } from '@/utils/date'

const DEFAULT_SET_COUNT = 3

export function useSession(uid: string, exerciseId: string) {
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

    if (todaySession && todaySession.sets.length > 0) {
      // Restore today's logged data
      todaySets.value = todaySession.sets.map((s) => ({ ...s }))
    } else {
      // Pre-fill set rows from last session count, or use default
      const rowCount = lastSession && lastSession.sets.length > 0
        ? lastSession.sets.length
        : DEFAULT_SET_COUNT
      todaySets.value = Array.from({ length: rowCount }, () => ({}))
    }
  }

  // ---------------------------------------------------------------------------
  // Mutation
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
  // Auto-save (2-second debounce)
  // ---------------------------------------------------------------------------
  function scheduleSave(): void {
    if (saveTimer !== null) clearTimeout(saveTimer)
    saveStatus.value = 'idle'
    saveTimer = setTimeout(() => {
      void persist()
    }, 2000)
  }

  async function persist(): Promise<void> {
    // Filter out empty rows before saving
    const validSets = todaySets.value.filter(
      (s): s is Set =>
        s.weight !== undefined &&
        s.weight >= 0.5 &&
        s.reps !== undefined &&
        s.reps >= 1,
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
    } catch (e) {
      saveStatus.value = 'error'
      saveError.value = 'Failed to save. Check your connection.'
      console.error(e)
    }
  }

  // Also trigger save when sets array length changes (add set)
  watch(
    () => todaySets.value.length,
    () => {
      if (todaySets.value.some((s) => s.weight !== undefined || s.reps !== undefined)) {
        scheduleSave()
      }
    },
  )

  return {
    todaySets: todaySets as Ref<Partial<Set>[]>,
    lastSets,
    lastSessionDate,
    saveStatus,
    saveError,
    updateSet,
    addSet,
    init,
  }
}
