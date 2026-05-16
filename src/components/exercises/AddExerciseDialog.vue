<template>
  <v-dialog :model-value="true" max-width="400" @update:model-value="$emit('close')">
    <v-card>
      <v-card-title>Add exercise</v-card-title>
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
        <v-btn color="primary" :loading="loading" @click="submit">Add</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useExercises } from '@/composables/useExercises'

const emit = defineEmits<{ close: [id?: string] }>()

const authStore = useAuthStore()
const { addExercise } = useExercises(authStore.currentUser!.uid)

const name = ref('')
const errorMessage = ref('')
const loading = ref(false)

async function submit(): Promise<void> {
  errorMessage.value = ''
  loading.value = true
  try {
    const result = await addExercise(name.value)
    if (result.error) {
      errorMessage.value = result.error
    } else {
      emit('close', result.id)
    }
  } catch (e) {
    errorMessage.value = 'Failed to save. Check your connection and permissions.'
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>
