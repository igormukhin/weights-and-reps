<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-title>Weights &amp; Reps</v-app-bar-title>
    <template #append>
      <v-btn :icon="mdiPencil" aria-label="Edit" @click="router.push('/exercises/edit')" />
      <v-btn :icon="mdiLogout" @click="handleSignOut" />
    </template>
  </v-app-bar>

  <v-main>
    <v-container class="pa-0">
      <div v-if="isLoading" class="d-flex justify-center mt-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <div v-else-if="exercises.length === 0" class="text-center mt-12">
        <v-icon size="64" color="medium-emphasis" :icon="mdiDumbbell" />
        <p class="text-h6 mt-4 text-medium-emphasis">No exercises yet</p>
        <p class="text-body-2 text-medium-emphasis">Tap Edit to add your first exercise</p>
      </div>

      <ExerciseGroupedList v-else :exercises="exercises" />
    </v-container>
  </v-main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { mdiDumbbell, mdiLogout, mdiPencil } from '@mdi/js'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useExercisesStore } from '@/stores/exercises'
import { useExerciseLogStore } from '@/stores/exerciseLog'
import { signOut } from '@/services/auth'
import ExerciseGroupedList from '@/components/exercises/ExerciseGroupedList.vue'

const authStore = useAuthStore()
const exercisesStore = useExercisesStore()
const exerciseLogStore = useExerciseLogStore()
const router = useRouter()

const uid = authStore.currentUser!.uid
const isLoading = computed(() => exercisesStore.isLoading)
const exercises = computed(() => exercisesStore.exercises)

onMounted(async () => {
  await exercisesStore.loadExercises(uid)
})

async function handleSignOut(): Promise<void> {
  await signOut()
  exercisesStore.clear()
  exerciseLogStore.clear()
  router.push('/login')
}
</script>
