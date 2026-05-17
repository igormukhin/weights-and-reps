<template>
  <v-app-bar color="primary" density="comfortable" :data-save-status="saveStatus">
    <v-btn :icon="mdiArrowLeft" @click="router.back()" />
    <v-app-bar-title>{{ exercise?.name ?? '' }}</v-app-bar-title>
    <template #append>
      <!-- Save status indicator -->
      <v-chip
        v-if="saveStatus === 'saving' || saveStatus === 'error'"
        :color="statusColor"
        size="small"
        class="mr-2"
        label
      >
        {{ statusLabel }}
      </v-chip>
      <!-- Rename exercise button -->
      <v-btn
        :icon="mdiPencil"
        aria-label="Rename exercise"
        @click="showRenameDialog = true"
      />
    </template>
  </v-app-bar>

  <EditExerciseDialog
    v-if="showRenameDialog && exercise"
    :exercise-id="exerciseId"
    :current-name="exercise.name"
    @close="showRenameDialog = false"
  />

  <v-main>
    <v-container>

      <p v-if="exercise" class="text-subtitle-1 mb-4">{{ exercise.name }}</p>

      <!-- LOADING STATE -->
      <div v-if="isLoading" class="d-flex justify-center mt-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <!-- READ-ONLY MODE: no today ExerciseLog -->
      <template v-else-if="!hasTodayExerciseLog">

        <p v-if="lastExerciseLogDate" class="text-body-2 text-medium-emphasis mb-4">
          Last training: {{ lastExerciseLogDate }}
        </p>

        <table v-if="lastSets.length > 0" class="mb-4">
          <thead>
            <tr class="text-caption text-medium-emphasis">
              <th class="text-left pb-1 pr-6">#</th>
              <th class="text-right pb-1 pr-6">Weight</th>
              <th class="pb-1 pr-6"></th>
              <th class="text-right pb-1">Reps</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(set, index) in lastSets" :key="index" class="text-body-1">
              <td class="pr-6 text-medium-emphasis py-1">{{ index + 1 }}</td>
              <td class="pr-6 text-right py-1">{{ set.weight.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }} kg</td>
              <td class="pr-6 py-1">{{ set.bumpIt ? '🆙' : '' }}</td>
              <td class="text-right py-1">{{ set.reps }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Empty state -->
        <p v-else class="text-body-2 text-medium-emphasis mb-4">
          No logs recorded yet
        </p>

        <!-- Pump it! button -->
        <v-btn color="primary" block class="mt-6" @click="startExerciseLog()">
          Pump it!
        </v-btn>

      </template>

      <!-- EDIT MODE: today ExerciseLog exists -->
      <template v-else-if="hasTodayExerciseLog">

        <!-- Column headers -->
        <v-row no-gutters class="mb-1 text-caption text-medium-emphasis">
          <v-col cols="1" class="text-center">#</v-col>
          <v-col cols="5" class="text-center">kg</v-col>
          <v-col cols="1"></v-col>
          <v-col cols="5" class="text-center">Reps</v-col>
        </v-row>

        <v-divider class="mb-2" />

        <!-- Set rows -->
        <SetRow
          v-for="(set, index) in todaySets"
          :key="index"
          :set-number="index + 1"
          :new-weight="set.weight"
          :new-reps="set.reps"
          :bump-it="set.bumpIt"
          :weight-step="weightStep"
          :prev-new-weight="index > 0 ? todaySets[index - 1]?.weight : undefined"
          :prev-new-reps="index > 0 ? todaySets[index - 1]?.reps : undefined"
          @update:new-weight="(v) => updateSet(index, 'weight', v)"
          @update:new-reps="(v) => updateSet(index, 'reps', v)"
          @update:bump-it="() => toggleBumpIt(index)"
        />

      </template>
    </v-container>
  </v-main>

  <!-- Delete ExerciseLog FAB — shown once log is persisted or has unsaved data -->
  <v-btn
    v-if="showDeleteButton"
    data-testid="delete-exercise-log-fab"
    color="error"
    :icon="mdiDelete"
    size="large"
    position="fixed"
    location="bottom left"
    class="ma-4"
    @click="showDeleteDialog = true"
  />

  <!-- Save error snackbar -->
  <v-snackbar
    v-model="showError"
    color="error"
    timeout="4000"
    location="bottom"
  >
    {{ saveError }}
    <template #actions>
      <v-btn variant="text" @click="showError = false">Dismiss</v-btn>
    </template>
  </v-snackbar>

  <!-- Delete confirmation dialog -->
  <DeleteExerciseLogDialog
    v-model="showDeleteDialog"
    @confirm="handleDelete"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { mdiArrowLeft, mdiDelete, mdiPencil } from '@mdi/js'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useExercisesStore } from '@/stores/exercises'
import { useExerciseLog } from '@/composables/useExerciseLog'
import SetRow from '@/components/exerciseLog/SetRow.vue'
import DeleteExerciseLogDialog from '@/components/exerciseLog/DeleteExerciseLogDialog.vue'
import EditExerciseDialog from '@/components/exercises/EditExerciseDialog.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const exercisesStore = useExercisesStore()

const exerciseId = route.params.id as string
const uid = authStore.currentUser!.uid

const exercise = computed(() => exercisesStore.getById(exerciseId))

const isDumbbell = computed(() => {
  const name = exercise.value?.name.toLowerCase() ?? ''
  return name.includes('dumbbell') || name.includes('kurzhantel')
})
const weightStep = computed(() => isDumbbell.value ? 2 : 2.5)

const {
  isLoading,
  hasTodayExerciseLog,
  isExerciseLogPersisted,
  todaySets,
  lastSets,
  lastExerciseLogDate,
  saveStatus,
  saveError,
  init,
  flushSave,
  startExerciseLog,
  updateSet,
  toggleBumpIt,
  deleteExerciseLog,
} = useExerciseLog(uid, exerciseId)

const showError = ref(false)
const showDeleteDialog = ref(false)
const showRenameDialog = ref(false)

watch(saveError, (val) => {
  if (val) showError.value = true
})

const showDeleteButton = computed(() =>
  isExerciseLogPersisted.value ||
  todaySets.value.some((s) => s.weight !== undefined || s.reps !== undefined),
)

const statusColor = computed(() => {
  if (saveStatus.value === 'saving') return 'orange'
  if (saveStatus.value === 'error') return 'error'
  return undefined
})

const statusLabel = computed(() => {
  if (saveStatus.value === 'saving') return 'Saving…'
  if (saveStatus.value === 'error') return 'Error'
  return ''
})

async function handleDelete(): Promise<void> {
  showDeleteDialog.value = false
  await deleteExerciseLog()
}

onBeforeUnmount(() => {
  flushSave()
})

onMounted(async () => {
  if (!exercise.value && authStore.currentUser) {
    await exercisesStore.loadExercises(authStore.currentUser.uid)
  }
  await init()
})
</script>
