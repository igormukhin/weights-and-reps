<template>
  <v-app-bar color="primary" density="comfortable">
    <v-btn icon="mdi-arrow-left" @click="router.back()" />
    <v-app-bar-title>{{ exercise?.name ?? '' }}</v-app-bar-title>
    <template #append>
      <!-- Save status indicator -->
      <v-chip
        v-if="saveStatus !== 'idle'"
        :color="statusColor"
        size="small"
        class="mr-2"
        label
      >
        {{ statusLabel }}
      </v-chip>
    </template>
  </v-app-bar>

  <v-main>
    <v-container>

      <!-- LOADING STATE -->
      <div v-if="isLoading" class="d-flex justify-center mt-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <!-- READ-ONLY MODE: no today session -->
      <template v-else-if="!hasTodaySession">

        <p v-if="lastSessionDate" class="text-body-2 text-medium-emphasis mb-4">
          Last training: {{ lastSessionDate }}
        </p>

        <table v-if="lastSets.length > 0" class="mb-4">
          <thead>
            <tr class="text-caption text-medium-emphasis">
              <th class="text-left pb-1 pr-6">#</th>
              <th class="text-right pb-1 pr-6">Weight</th>
              <th class="text-right pb-1">Reps</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(set, index) in lastSets" :key="index" class="text-body-1">
              <td class="pr-6 text-medium-emphasis py-1">{{ index + 1 }}</td>
              <td class="pr-6 text-right py-1">{{ set.weight.toFixed(1) }} kg</td>
              <td class="text-right py-1">{{ set.reps }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Empty state -->
        <p v-else class="text-body-2 text-medium-emphasis mb-4">
          No sessions recorded yet
        </p>

        <!-- Pump it! button -->
        <v-btn color="primary" block class="mt-6" @click="startSession()">
          Pump it!
        </v-btn>

      </template>

      <!-- EDIT MODE: today session exists -->
      <template v-else-if="hasTodaySession">

        <!-- Column headers -->
        <v-row no-gutters class="mb-1 text-caption text-medium-emphasis">
          <v-col cols="1" class="text-center">#</v-col>
          <v-col cols="6" class="text-center">kg</v-col>
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
          :prev-new-weight="index > 0 ? todaySets[index - 1]?.weight : undefined"
          :prev-new-reps="index > 0 ? todaySets[index - 1]?.reps : undefined"
          @update:new-weight="(v) => updateSet(index, 'weight', v)"
          @update:new-reps="(v) => updateSet(index, 'reps', v)"
        />

        <AddSetButton @add-set="addSet" />

        <!-- Delete session button — shown once session is persisted or has unsaved data -->
        <v-btn
          v-if="showDeleteButton"
          color="error"
          variant="tonal"
          block
          class="mt-6"
          @click="showDeleteDialog = true"
        >
          Delete
        </v-btn>

      </template>
    </v-container>
  </v-main>

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
  <DeleteSessionDialog
    v-model="showDeleteDialog"
    @confirm="handleDelete"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useExercisesStore } from '@/stores/exercises'
import { useSession } from '@/composables/useSession'
import SetRow from '@/components/session/SetRow.vue'
import AddSetButton from '@/components/session/AddSetButton.vue'
import DeleteSessionDialog from '@/components/session/DeleteSessionDialog.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const exercisesStore = useExercisesStore()

const exerciseId = route.params.id as string
const uid = authStore.currentUser!.uid

const exercise = computed(() => exercisesStore.getById(exerciseId))

const {
  isLoading,
  hasTodaySession,
  isSessionPersisted,
  todaySets,
  lastSets,
  lastSessionDate,
  saveStatus,
  saveError,
  init,
  flushSave,
  startSession,
  updateSet,
  addSet,
  deleteSession,
} = useSession(uid, exerciseId)

const showError = ref(false)
const showDeleteDialog = ref(false)

watch(saveError, (val) => {
  if (val) showError.value = true
})

const showDeleteButton = computed(() =>
  isSessionPersisted.value ||
  todaySets.value.some((s) => s.weight !== undefined || s.reps !== undefined),
)

const statusColor = computed(() => {
  if (saveStatus.value === 'saving') return 'orange'
  if (saveStatus.value === 'saved') return 'success'
  if (saveStatus.value === 'error') return 'error'
  return undefined
})

const statusLabel = computed(() => {
  if (saveStatus.value === 'saving') return 'Saving…'
  if (saveStatus.value === 'saved') return 'Saved'
  if (saveStatus.value === 'error') return 'Error'
  return ''
})

async function handleDelete(): Promise<void> {
  showDeleteDialog.value = false
  await deleteSession()
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
