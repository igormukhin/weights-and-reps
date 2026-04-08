<template>
  <v-list-item
    class="exercise-item pa-0"
    :ripple="false"
  >
    <!-- Drag handle -->
    <template #prepend>
      <v-icon v-show="isEditMode" class="drag-handle mr-1 text-medium-emphasis" icon="mdi-drag" />
    </template>

    <!-- Exercise name — tap to navigate (disabled in edit mode) -->
    <v-list-item-title
      class="exercise-name"
      @click="!isEditMode && router.push(`/exercises/${exercise.id}`)"
    >
      {{ exercise.name }}
    </v-list-item-title>

    <!-- Action buttons (edit mode only) -->
    <template #append>
      <v-btn
        v-show="isEditMode"
        icon="mdi-pencil-outline"
        size="small"
        variant="text"
        @click.stop="showEdit = true"
      />
      <v-btn
        v-show="isEditMode"
        icon="mdi-eye-off-outline"
        size="small"
        variant="text"
        @click.stop="showHide = true"
      />
    </template>
  </v-list-item>

  <EditExerciseDialog
    v-if="showEdit"
    :exercise-id="exercise.id"
    :current-name="exercise.name"
    @close="showEdit = false"
  />

  <HideExerciseDialog
    v-if="showHide"
    :exercise-id="exercise.id"
    :exercise-name="exercise.name"
    @close="showHide = false"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Exercise } from '@/types'
import EditExerciseDialog from './EditExerciseDialog.vue'
import HideExerciseDialog from './HideExerciseDialog.vue'

defineProps<{ exercise: Exercise; isEditMode: boolean }>()

const router = useRouter()
const showEdit = ref(false)
const showHide = ref(false)
</script>

<style scoped>
.exercise-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  min-height: 52px;
}
.exercise-name {
  cursor: pointer;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.drag-handle {
  cursor: grab;
}

.exercise-item :deep(.v-list-item__prepend) {
  padding-inline-end: 0;
}

.exercise-item :deep(.v-list-item__prepend) {
  --v-list-prepend-gap: 8px;
}

.exercise-item :deep(.v-list-item__append) {
  padding-inline-start: 0;
  gap: 0;
}

.exercise-item :deep(.v-list-item__append .v-btn) {
  width: 32px;
  height: 32px;
}
</style>
