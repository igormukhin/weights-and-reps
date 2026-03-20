<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-title>Weights &amp; Reps</v-app-bar-title>
    <template #append>
      <v-btn icon="mdi-logout" @click="handleSignOut" />
    </template>
  </v-app-bar>

  <v-main>
    <v-container>
      <!-- Empty state -->
      <div v-if="exercises.length === 0" class="text-center mt-12">
        <v-icon size="64" color="medium-emphasis">mdi-dumbbell</v-icon>
        <p class="text-h6 mt-4 text-medium-emphasis">No exercises yet</p>
        <p class="text-body-2 text-medium-emphasis">Tap + to add your first exercise</p>
      </div>

      <!-- Draggable exercise list -->
      <v-list v-else lines="one" class="pa-0">
        <draggable
          :model-value="exercises"
          item-key="id"
          handle=".drag-handle"
          @end="onDragEnd"
        >
          <template #item="{ element }">
            <ExerciseListItem :exercise="element" />
          </template>
        </draggable>
      </v-list>
    </v-container>
  </v-main>

  <!-- Add exercise FAB -->
  <v-btn
    color="primary"
    icon="mdi-plus"
    size="large"
    position="fixed"
    location="bottom right"
    class="ma-4"
    @click="showAddDialog = true"
  />

  <AddExerciseDialog
    v-if="showAddDialog"
    @close="onAddDialogClose"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import draggable from 'vuedraggable'
import { useAuthStore } from '@/stores/auth'
import { useExercisesStore } from '@/stores/exercises'
import { useExercises } from '@/composables/useExercises'
import { signOut } from '@/services/auth'
import type { Exercise } from '@/types'
import ExerciseListItem from '@/components/exercises/ExerciseListItem.vue'
import AddExerciseDialog from '@/components/exercises/AddExerciseDialog.vue'

const authStore = useAuthStore()
const exercisesStore = useExercisesStore()
const router = useRouter()

const uid = authStore.currentUser!.uid
const { reorder } = useExercises(uid)

const exercises = computed(() => exercisesStore.exercises)
const showAddDialog = ref(false)

onMounted(async () => {
  await exercisesStore.loadExercises(uid)
})

async function handleSignOut(): Promise<void> {
  await signOut()
  router.push('/login')
}

async function onAddDialogClose(): Promise<void> {
  showAddDialog.value = false
  await exercisesStore.loadExercises(uid)
}

async function onDragEnd(event: { newIndex: number; oldIndex: number }): Promise<void> {
  if (event.newIndex === event.oldIndex) return
  const reordered = [...exercises.value]
  const [moved] = reordered.splice(event.oldIndex, 1)
  reordered.splice(event.newIndex, 0, moved as Exercise)
  await reorder(reordered)
}
</script>
