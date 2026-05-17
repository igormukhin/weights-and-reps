<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-title>Edit Exercises</v-app-bar-title>
    <template #append>
      <v-btn variant="text" @click="router.back()">Done</v-btn>
      <v-btn :icon="mdiLogout" @click="handleSignOut" />
    </template>
  </v-app-bar>

  <v-main>
    <v-container>
      <div v-if="isLoading" class="d-flex justify-center mt-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <div v-else-if="exercises.length === 0" class="text-center mt-12">
        <v-icon size="64" color="medium-emphasis" :icon="mdiDumbbell" />
        <p class="text-h6 mt-4 text-medium-emphasis">No exercises yet</p>
        <p class="text-body-2 text-medium-emphasis">Tap the + button to add your first exercise</p>
      </div>

      <v-list v-else lines="one" class="pa-0">
        <draggable
          v-model="exercises"
          item-key="id"
          handle=".drag-handle"
          @end="onDragEnd"
        >
          <template #item="{ element }">
            <div>
              <ExerciseListItemEdit :exercise="element" @renamed="exercisesStore.setLastSelected" />
            </div>
          </template>
        </draggable>
      </v-list>
    </v-container>
  </v-main>

  <v-btn
    color="primary"
    :icon="mdiPlus"
    size="large"
    position="fixed"
    location="bottom right"
    class="ma-4"
    data-testid="add-exercise-fab"
    @click="showAddDialog = true"
  />

  <AddExerciseDialog
    v-if="showAddDialog"
    @close="onAddDialogClose"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { mdiDumbbell, mdiLogout, mdiPlus } from '@mdi/js'
import { useRouter } from 'vue-router'
import draggable from 'vuedraggable'
import { useAuthStore } from '@/stores/auth'
import { useExercisesStore } from '@/stores/exercises'
import { useExerciseLogStore } from '@/stores/exerciseLog'
import { useExercises } from '@/composables/useExercises'
import { signOut } from '@/services/auth'
import ExerciseListItemEdit from '@/components/exercises/ExerciseListItemEdit.vue'
import AddExerciseDialog from '@/components/exercises/AddExerciseDialog.vue'

const authStore = useAuthStore()
const exercisesStore = useExercisesStore()
const exerciseLogStore = useExerciseLogStore()
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
  exerciseLogStore.clear()
  router.push('/login')
}

async function onAddDialogClose(id?: string): Promise<void> {
  showAddDialog.value = false
  await exercisesStore.loadExercises(uid)
  if (id) exercisesStore.setLastSelected(id)
}

async function onDragEnd(event: { newIndex: number; oldIndex: number }): Promise<void> {
  if (event.newIndex === event.oldIndex) return
  await reorder(exercises.value)
}
</script>
