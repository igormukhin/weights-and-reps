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
      <!-- Last session date -->
      <p v-if="lastSessionDate" class="text-body-2 text-medium-emphasis mb-4">
        Last training: {{ lastSessionDate }}
      </p>

      <!-- Column headers -->
      <v-row no-gutters class="mb-1 text-caption text-medium-emphasis">
        <v-col cols="1" class="text-center">#</v-col>
        <v-col cols="2" class="text-center">Last kg</v-col>
        <v-col cols="1" class="text-center">Last reps</v-col>
        <v-col cols="4" class="text-center">kg</v-col>
        <v-col cols="4" class="text-center">Reps</v-col>
      </v-row>

      <v-divider class="mb-2" />

      <!-- Set rows -->
      <SetRow
        v-for="(set, index) in todaySets"
        :key="index"
        :set-number="index + 1"
        :last-weight="lastSets[index]?.weight"
        :last-reps="lastSets[index]?.reps"
        :new-weight="set.weight"
        :new-reps="set.reps"
        :prev-new-weight="index > 0 ? todaySets[index - 1]?.weight : undefined"
        :prev-new-reps="index > 0 ? todaySets[index - 1]?.reps : undefined"
        @update:new-weight="(v) => updateSet(index, 'weight', v)"
        @update:new-reps="(v) => updateSet(index, 'reps', v)"
      />

      <AddSetButton @add-set="addSet" />
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
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useExercisesStore } from '@/stores/exercises'
import { useSession } from '@/composables/useSession'
import SetRow from '@/components/session/SetRow.vue'
import AddSetButton from '@/components/session/AddSetButton.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const exercisesStore = useExercisesStore()

const exerciseId = route.params.id as string
const uid = authStore.currentUser!.uid

const exercise = computed(() => exercisesStore.getById(exerciseId))

const { todaySets, lastSets, lastSessionDate, saveStatus, saveError, updateSet, addSet, init } =
  useSession(uid, exerciseId)

const showError = ref(false)

watch(saveError, (val) => {
  if (val) showError.value = true
})

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

onMounted(async () => {
  if (!exercise.value && authStore.currentUser) {
    await exercisesStore.loadExercises(authStore.currentUser.uid)
  }
  await init()
})
</script>
