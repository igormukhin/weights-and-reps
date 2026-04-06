import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Set } from '@/types'

export interface CachedSession {
  date: string
  hasTodaySession: boolean
  isSessionPersisted: boolean
  todaySets: Partial<Set>[]
  lastSets: Set[]
  lastSessionDate: string
}

export const useSessionStore = defineStore('session', () => {
  const cache = ref<Record<string, CachedSession>>({})

  function get(exerciseId: string, today: string): CachedSession | null {
    const entry = cache.value[exerciseId]
    return entry?.date === today ? entry : null
  }

  function set(exerciseId: string, data: CachedSession): void {
    cache.value[exerciseId] = data
  }

  function clear(): void {
    cache.value = {}
  }

  return { get, set, clear }
})
