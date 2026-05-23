import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Exercise } from '@/types'
import { getExercises } from '@/services/exercises'

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export const useExercisesStore = defineStore('exercises', () => {
  const exercises = ref<Exercise[]>([])
  const categories = computed(() => {
    const cats = exercises.value
      .map((e) => e.category?.trim())
      .filter((c): c is string => !!c)
    return Array.from(new Set(cats)).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' }),
    )
  })
  const isLoading = ref(false)
  const lastLoadedAt = ref(0)
  const lastSelectedExerciseId = ref<string | null>(
    typeof window !== 'undefined'
      ? sessionStorage.getItem('lastSelectedExerciseId')
      : null,
  )

  async function loadExercises(uid: string, { force = false } = {}): Promise<void> {
    if (!force && lastLoadedAt.value > 0 && Date.now() - lastLoadedAt.value < CACHE_TTL_MS) {
      return
    }
    isLoading.value = true
    exercises.value = await getExercises(uid)
    lastLoadedAt.value = Date.now()
    isLoading.value = false
  }

  function getById(id: string): Exercise | undefined {
    return exercises.value.find((e) => e.id === id)
  }

  function clear(): void {
    exercises.value = []
    lastLoadedAt.value = 0
  }

  function setLastSelected(id: string): void {
    lastSelectedExerciseId.value = id
    sessionStorage.setItem('lastSelectedExerciseId', id)
  }

  function clearLastSelected(): void {
    lastSelectedExerciseId.value = null
    sessionStorage.removeItem('lastSelectedExerciseId')
  }

  return {
    exercises,
    categories,
    isLoading,
    loadExercises,
    getById,
    clear,
    lastSelectedExerciseId,
    setLastSelected,
    clearLastSelected,
  }
})
