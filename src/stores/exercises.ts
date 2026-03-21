import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Exercise } from '@/types'
import { getExercises } from '@/services/exercises'

export const useExercisesStore = defineStore('exercises', () => {
  const exercises = ref<Exercise[]>([])
  const isLoading = ref(false)

  async function loadExercises(uid: string): Promise<void> {
    isLoading.value = true
    exercises.value = await getExercises(uid)
    isLoading.value = false
  }

  function getById(id: string): Exercise | undefined {
    return exercises.value.find((e) => e.id === id)
  }

  return { exercises, isLoading, loadExercises, getById }
})
