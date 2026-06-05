import { ref } from 'vue'
import type { Ref } from 'vue'
import type { ExerciseLog, Set, SaveStatus } from '@/types'
import {
  getTodayExerciseLog,
  getPastExerciseLogs,
  saveExerciseLog,
  deleteExerciseLog as deleteExerciseLogService,
} from '@/services/exerciseLogs'
import { todayISO, formatGermanDate } from '@/utils/date'
import { enforceRowInvariants } from '@/utils/setRowInvariants'
import { useExerciseLogStore } from '@/stores/exerciseLog'

export function useExerciseLog(uid: string, exerciseId: string) {
  const exerciseLogStore = useExerciseLogStore()

  const isLoading = ref(true)
  const hasTodayExerciseLog = ref(false)
  const isExerciseLogPersisted = ref(false)
  const todaySets = ref<Partial<Set>[]>([])
  const lastSets = ref<Set[]>([])
  const lastExerciseLogDate = ref('')
  const pastExerciseLogs = ref<ExerciseLog[]>([])
  const saveStatus = ref<SaveStatus>('idle')
  const saveError = ref<string | null>(null)
  const activeDate = ref(todayISO())

  let saveTimer: ReturnType<typeof setTimeout> | null = null
  let refreshPromise: Promise<void> | null = null

  // ---------------------------------------------------------------------------
  // Cache sync
  // ---------------------------------------------------------------------------
  function syncToCache(): void {
    exerciseLogStore.set(exerciseId, {
      date: activeDate.value,
      hasTodayExerciseLog: hasTodayExerciseLog.value,
      isExerciseLogPersisted: isExerciseLogPersisted.value,
      todaySets: todaySets.value.map((s) => ({ ...s })),
      lastSets: lastSets.value,
      lastExerciseLogDate: lastExerciseLogDate.value,
      pastExerciseLogs: pastExerciseLogs.value,
    })
  }

  // ---------------------------------------------------------------------------
  // Init: load the ExerciseLog and history for Today.
  // ---------------------------------------------------------------------------
  async function loadForDate(date: string, { force = false }: { force?: boolean } = {}): Promise<void> {
    activeDate.value = date
    isLoading.value = true
    saveStatus.value = 'idle'
    saveError.value = null

    // Serve from cache if available for this calendar date.
    const cached = force ? null : exerciseLogStore.get(exerciseId, date)
    if (cached) {
      hasTodayExerciseLog.value = cached.hasTodayExerciseLog
      isExerciseLogPersisted.value = cached.isExerciseLogPersisted
      todaySets.value = cached.todaySets.map((s) => ({ ...s }))
      lastSets.value = cached.lastSets
      lastExerciseLogDate.value = cached.lastExerciseLogDate
      pastExerciseLogs.value = cached.pastExerciseLogs
      if (hasTodayExerciseLog.value) {
        enforceRowInvariants(todaySets.value)
        syncToCache()
      }
      isLoading.value = false
      return
    }

    // Cache miss — fetch from Firestore
    const [todayLog, pastLogs] = await Promise.all([
      getTodayExerciseLog(uid, exerciseId, date),
      getPastExerciseLogs(uid, exerciseId, date, 6),
    ])

    const lastLog = pastLogs[0]
    pastExerciseLogs.value = pastLogs
    lastSets.value = lastLog?.sets ?? []
    lastExerciseLogDate.value = lastLog ? formatGermanDate(lastLog.date) : ''

    isLoading.value = false

    if (todayLog) {
      hasTodayExerciseLog.value = true
      isExerciseLogPersisted.value = true
      todaySets.value = todayLog.sets.map((s) => ({ ...s }))
      enforceRowInvariants(todaySets.value)
    } else {
      hasTodayExerciseLog.value = false
      isExerciseLogPersisted.value = false
      todaySets.value = []
    }

    syncToCache()
  }

  async function init(): Promise<void> {
    await loadForDate(todayISO())
  }

  // ---------------------------------------------------------------------------
  // Start a new ExerciseLog for the active date: pre-fill from last log, enter Logging mode.
  // ExerciseLog is NOT written to Firestore yet — that happens on first data entry.
  // ---------------------------------------------------------------------------
  function startExerciseLog(): void {
    todaySets.value = lastSets.value.length > 0
      ? lastSets.value.map((s) => ({ ...s }))
      : []
    enforceRowInvariants(todaySets.value)
    hasTodayExerciseLog.value = true
    isExerciseLogPersisted.value = false
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
  // Delete the active ExerciseLog.
  // ---------------------------------------------------------------------------
  async function deleteExerciseLog(): Promise<void> {
    // Cancel any pending debounced save so it doesn't fire after deletion
    if (saveTimer !== null) {
      clearTimeout(saveTimer)
      saveTimer = null
    }

    if (isExerciseLogPersisted.value) {
      try {
        await deleteExerciseLogService(uid, exerciseId, activeDate.value)
      } catch (e) {
        saveStatus.value = 'error'
        saveError.value = 'Failed to delete. Check your connection.'
        console.error(e)
        return
      }
    }

    hasTodayExerciseLog.value = false
    isExerciseLogPersisted.value = false
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
    const date = activeDate.value
    saveTimer = setTimeout(() => {
      saveTimer = null
      void persist(date)
    }, 2000)
  }

  /** Cancel any pending debounced save and persist immediately. Call on navigation away. */
  async function flushSave(): Promise<boolean> {
    if (saveTimer !== null) {
      clearTimeout(saveTimer)
      saveTimer = null
      return await persist(activeDate.value)
    }
    return true
  }

  async function persist(date: string = activeDate.value): Promise<boolean> {
    const validSets = todaySets.value.filter(
      (s): s is Set => s.weight !== undefined,
    )

    // All inputs empty — delete persisted ExerciseLog, or skip if not yet saved
    if (validSets.length === 0) {
      if (isExerciseLogPersisted.value) {
        saveStatus.value = 'saving'
        saveError.value = null
        try {
          await deleteExerciseLogService(uid, exerciseId, date)
          isExerciseLogPersisted.value = false
          saveStatus.value = 'saved'
          syncToCache()
        } catch (e) {
          saveStatus.value = 'error'
          saveError.value = 'Failed to save. Check your connection.'
          console.error(e)
          return false
        }
      }
      return true
    }

    saveStatus.value = 'saving'
    saveError.value = null

    try {
      await saveExerciseLog(uid, exerciseId, {
        exerciseId,
        date,
        sets: validSets,
      })
      saveStatus.value = 'saved'
      isExerciseLogPersisted.value = true
      syncToCache()
      return true
    } catch (e) {
      saveStatus.value = 'error'
      saveError.value = 'Failed to save. Check your connection.'
      console.error(e)
      return false
    }
  }

  async function refreshForCurrentDate(): Promise<void> {
    if (todayISO() === activeDate.value) return
    if (refreshPromise) return refreshPromise

    refreshPromise = (async () => {
      const flushed = await flushSave()
      if (!flushed) return
      await loadForDate(todayISO(), { force: true })
    })()

    try {
      await refreshPromise
    } finally {
      refreshPromise = null
    }
  }

  return {
    isLoading: isLoading as Ref<boolean>,
    hasTodayExerciseLog: hasTodayExerciseLog as Ref<boolean>,
    isExerciseLogPersisted: isExerciseLogPersisted as Ref<boolean>,
    todaySets: todaySets as Ref<Partial<Set>[]>,
    lastSets,
    lastExerciseLogDate,
    pastExerciseLogs,
    saveStatus,
    saveError,
    init,
    flushSave,
    refreshForCurrentDate,
    startExerciseLog,
    updateSet,
    toggleBumpIt,
    deleteExerciseLog,
  }
}
