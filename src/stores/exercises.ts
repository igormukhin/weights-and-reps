import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Exercise } from '@/types'
import { getExercises } from '@/services/exercises'

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export const useExercisesStore = defineStore('exercises', () => {
  const exercises = ref<Exercise[]>([])
  const isLoading = ref(false)
  const lastLoadedAt = ref(0)

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

  return { exercises, isLoading, loadExercises, getById, clear }
})
