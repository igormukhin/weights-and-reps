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

  let saveTimer: ReturnType<typeof setTimeout> | null = null

  // ---------------------------------------------------------------------------
  // Cache sync
  // ---------------------------------------------------------------------------
  function syncToCache(): void {
    exerciseLogStore.set(exerciseId, {
      date: todayISO(),
      hasTodayExerciseLog: hasTodayExerciseLog.value,
      isExerciseLogPersisted: isExerciseLogPersisted.value,
      todaySets: todaySets.value.map((s) => ({ ...s })),
      lastSets: lastSets.value,
      lastExerciseLogDate: lastExerciseLogDate.value,
      pastExerciseLogs: pastExerciseLogs.value,
    })
  }

  // ---------------------------------------------------------------------------
  // Init: load today's ExerciseLog and last ExerciseLog on mount
  // ---------------------------------------------------------------------------
  async function init(): Promise<void> {
    const today = todayISO()

    // Serve from cache if available (same calendar day)
    const cached = exerciseLogStore.get(exerciseId, today)
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
      getTodayExerciseLog(uid, exerciseId, today),
      getPastExerciseLogs(uid, exerciseId, today, 6),
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

  // ---------------------------------------------------------------------------
  // Start a new ExerciseLog: pre-fill from last log, enter Logging mode.
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
  // Delete today's ExerciseLog
  // ---------------------------------------------------------------------------
  async function deleteExerciseLog(): Promise<void> {
    // Cancel any pending debounced save so it doesn't fire after deletion
    if (saveTimer !== null) {
      clearTimeout(saveTimer)
      saveTimer = null
    }

    if (isExerciseLogPersisted.value) {
      try {
        await deleteExerciseLogService(uid, exerciseId, todayISO())
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

    // All inputs empty — delete persisted ExerciseLog, or skip if not yet saved
    if (validSets.length === 0) {
      if (isExerciseLogPersisted.value) {
        saveStatus.value = 'saving'
        saveError.value = null
        try {
          await deleteExerciseLogService(uid, exerciseId, todayISO())
          isExerciseLogPersisted.value = false
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
      await saveExerciseLog(uid, exerciseId, {
        exerciseId,
        date: todayISO(),
        sets: validSets,
      })
      saveStatus.value = 'saved'
      isExerciseLogPersisted.value = true
      syncToCache()
    } catch (e) {
      saveStatus.value = 'error'
      saveError.value = 'Failed to save. Check your connection.'
      console.error(e)
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
    startExerciseLog,
    updateSet,
    toggleBumpIt,
    deleteExerciseLog,
  }
}
