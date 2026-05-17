import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Set } from '@/types'

export interface CachedExerciseLog {
  date: string
  hasTodayExerciseLog: boolean
  isExerciseLogPersisted: boolean
  todaySets: Partial<Set>[]
  lastSets: Set[]
  lastExerciseLogDate: string
}

export const useExerciseLogStore = defineStore('exerciseLog', () => {
  const cache = ref<Record<string, CachedExerciseLog>>({})

  function get(exerciseId: string, today: string): CachedExerciseLog | null {
    const entry = cache.value[exerciseId]
    return entry?.date === today ? entry : null
  }

  function set(exerciseId: string, data: CachedExerciseLog): void {
    cache.value[exerciseId] = data
  }

  function clear(): void {
    cache.value = {}
  }

  return { get, set, clear }
})
