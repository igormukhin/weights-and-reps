<template>
  <v-dialog :model-value="true" max-width="400" @update:model-value="$emit('close')">
    <v-card>
      <v-card-title>Rename exercise</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="name"
          label="Exercise name"
          autofocus
          :error-messages="errorMessage"
          @keyup.enter="submit"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="$emit('close')">Cancel</v-btn>
        <v-btn color="primary" :loading="loading" @click="submit">Save</v-btn>
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
  currentName: string
}>()

const emit = defineEmits<{ close: [] }>()

const authStore = useAuthStore()
const { renameExercise } = useExercises(authStore.currentUser!.uid)

const name = ref(props.currentName)
const errorMessage = ref('')
const loading = ref(false)

async function submit(): Promise<void> {
  errorMessage.value = ''
  loading.value = true
  const result = await renameExercise(props.exerciseId, name.value)
  loading.value = false
  if (result.error) {
    errorMessage.value = result.error
  } else {
    emit('close')
  }
}
</script>
