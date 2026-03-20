import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Exercise } from '@/types'
import { getExercises } from '@/services/exercises'

export const useExercisesStore = defineStore('exercises', () => {
  const exercises = ref<Exercise[]>([])

  async function loadExercises(uid: string): Promise<void> {
    exercises.value = await getExercises(uid)
  }

  function getById(id: string): Exercise | undefined {
    return exercises.value.find((e) => e.id === id)
  }

  return { exercises, loadExercises, getById }
})
