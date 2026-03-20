import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from 'firebase/auth'
import { onAuthStateChanged } from '@/services/auth'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const isAuthenticated = computed(() => currentUser.value !== null)

  function setUser(user: User | null): void {
    currentUser.value = user
  }

  // Start listening for auth state changes immediately when store is used.
  const unsubscribe = onAuthStateChanged((user) => {
    setUser(user)
  })

  function cleanup(): void {
    unsubscribe()
  }

  return { currentUser, isAuthenticated, setUser, cleanup }
})
