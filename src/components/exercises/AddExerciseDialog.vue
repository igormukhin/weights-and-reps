<template>
  <v-dialog :model-value="true" max-width="400" @update:model-value="$emit('close')">
    <v-card>
      <v-card-title>Add exercise</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="name"
          label="Exercise name"
          autofocus
          class="mb-3"
          :error-messages="errorMessage"
          @keyup.enter="submit"
        />
        <v-combobox
          v-model="category"
          label="Category (optional)"
          :items="categories"
          clearable
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
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useExercisesStore } from '@/stores/exercises'
import { useExercises } from '@/composables/useExercises'

const emit = defineEmits<{ close: [id?: string] }>()

const authStore = useAuthStore()
const exercisesStore = useExercisesStore()
const { addExercise } = useExercises(authStore.currentUser!.uid)

const name = ref('')
const category = ref<string | null>(null)
const errorMessage = ref('')
const loading = ref(false)

const categories = computed(() => exercisesStore.categories)

async function submit(): Promise<void> {
  errorMessage.value = ''
  loading.value = true
  try {
    const result = await addExercise(name.value, category.value || undefined)
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
