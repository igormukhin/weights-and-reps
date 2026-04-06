<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-title>Weights &amp; Reps</v-app-bar-title>
    <template #append>
      <v-btn icon="mdi-logout" @click="handleSignOut" />
    </template>
  </v-app-bar>

  <v-main>
    <v-container>
      <!-- Loading state -->
      <div v-if="isLoading" class="d-flex justify-center mt-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <!-- Empty state -->
      <div v-else-if="exercises.length === 0" class="text-center mt-12">
        <v-icon size="64" color="medium-emphasis">mdi-dumbbell</v-icon>
        <p class="text-h6 mt-4 text-medium-emphasis">No exercises yet</p>
        <p class="text-body-2 text-medium-emphasis">Tap + to add your first exercise</p>
      </div>

      <!-- Draggable exercise list -->
      <v-list v-else-if="exercises.length > 0" lines="one" class="pa-0">
        <draggable
          v-model="exercises"
          item-key="id"
          handle=".drag-handle"
          @end="onDragEnd"
        >
          <template #item="{ element }">
            <div>
              <ExerciseListItem :exercise="element" />
            </div>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import draggable from 'vuedraggable'
import { useAuthStore } from '@/stores/auth'
import { useExercisesStore } from '@/stores/exercises'
import { useSessionStore } from '@/stores/session'
import { useExercises } from '@/composables/useExercises'
import { signOut } from '@/services/auth'
import ExerciseListItem from '@/components/exercises/ExerciseListItem.vue'
import AddExerciseDialog from '@/components/exercises/AddExerciseDialog.vue'

const authStore = useAuthStore()
const exercisesStore = useExercisesStore()
const sessionStore = useSessionStore()
const router = useRouter()

const uid = authStore.currentUser!.uid
const { reorder } = useExercises(uid)

const isLoading = computed(() => exercisesStore.isLoading)
const exercises = ref([...exercisesStore.exercises])
watch(() => exercisesStore.exercises, (val) => { exercises.value = [...val] })
const showAddDialog = ref(false)

onMounted(async () => {
  await exercisesStore.loadExercises(uid)
})

async function handleSignOut(): Promise<void> {
  await signOut()
  exercisesStore.clear()
  sessionStore.clear()
  router.push('/login')
}

async function onAddDialogClose(): Promise<void> {
  showAddDialog.value = false
  await exercisesStore.loadExercises(uid)
}

async function onDragEnd(event: { newIndex: number; oldIndex: number }): Promise<void> {
  if (event.newIndex === event.oldIndex) return
  await reorder(exercises.value)
}
</script>
