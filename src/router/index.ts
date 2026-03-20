import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authReady } from '@/services/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/exercises',
      name: 'exercises',
      component: () => import('@/views/ExercisesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/exercises/:id',
      name: 'exercise-detail',
      component: () => import('@/views/ExerciseDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/',
      redirect: '/exercises',
    },
  ],
})

router.beforeEach(async (to) => {
  // Wait for Firebase to resolve the initial auth state before any guard logic.
  await authReady

  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'exercises' }
  }
})

export default router
