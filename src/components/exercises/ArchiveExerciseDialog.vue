<template>
  <v-dialog :model-value="true" max-width="400" @update:model-value="$emit('close')">
    <v-card>
      <v-card-title>Archive exercise?</v-card-title>
      <v-card-text>
        <p>
          <strong>{{ exerciseName }}</strong> will be removed from your list.
        </p>
        <p class="mt-2 text-body-2 text-medium-emphasis">
          This cannot be undone from within the app. Your historical training data
          will be preserved.
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="$emit('close')">Cancel</v-btn>
        <v-btn color="error" :loading="loading" @click="confirm">Archive</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useExercises } from '@/composables/useExercises'

const props = defineProps<{
  exerciseId: string
  exerciseName: string
}>()

const emit = defineEmits<{ close: [] }>()

const authStore = useAuthStore()
const { archiveExercise } = useExercises(authStore.currentUser!.uid)

const loading = ref(false)

async function confirm(): Promise<void> {
  loading.value = true
  await archiveExercise(props.exerciseId)
  loading.value = false
  emit('close')
}
</script>
