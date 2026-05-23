<template>
  <v-dialog :model-value="true" max-width="400" @update:model-value="$emit('close')">
    <v-card>
      <v-card-title>Edit exercise</v-card-title>
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
        <v-btn color="primary" :loading="loading" @click="submit">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useExercisesStore } from '@/stores/exercises'
import { useExercises } from '@/composables/useExercises'

const props = defineProps<{
  exerciseId: string
  currentName: string
  currentCategory?: string
}>()

const emit = defineEmits<{ close: [id?: string] }>()

const authStore = useAuthStore()
const exercisesStore = useExercisesStore()
const { renameExercise } = useExercises(authStore.currentUser!.uid)

const name = ref(props.currentName)
const category = ref<string | null>(props.currentCategory || null)
const errorMessage = ref('')
const loading = ref(false)

const categories = computed(() => exercisesStore.categories)

async function submit(): Promise<void> {
  errorMessage.value = ''
  loading.value = true
  const result = await renameExercise(props.exerciseId, name.value, category.value || undefined)
  loading.value = false
  if (result.error) {
    errorMessage.value = result.error
  } else {
    emit('close', props.exerciseId)
  }
}
</script>
