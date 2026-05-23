<template>
  <v-list-item
    class="exercise-item pa-0"
    :ripple="false"
  >
    <template #prepend>
      <v-icon class="drag-handle mr-1 text-medium-emphasis" :icon="mdiDrag" />
    </template>

    <v-list-item-title class="exercise-name">
      <span v-if="exercise.category" class="text-medium-emphasis mr-1">{{ exercise.category }}:</span>
      <span>{{ exercise.name }}</span>
    </v-list-item-title>

    <template #append>
      <v-btn
        :icon="mdiPencilOutline"
        size="small"
        variant="text"
        data-testid="rename-exercise-btn"
        @click.stop="showEdit = true"
      />
      <v-btn
        :icon="mdiEyeOffOutline"
        size="small"
        variant="text"
        data-testid="archive-exercise-btn"
        @click.stop="showArchive = true"
      />
    </template>
  </v-list-item>

  <EditExerciseDialog
    v-if="showEdit"
    :exercise-id="exercise.id"
    :current-name="exercise.name"
    :current-category="exercise.category"
    @close="onEditClose"
  />

  <ArchiveExerciseDialog
    v-if="showArchive"
    :exercise-id="exercise.id"
    :exercise-name="exercise.name"
    @close="showArchive = false"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { mdiDrag, mdiEyeOffOutline, mdiPencilOutline } from '@mdi/js'
import type { Exercise } from '@/types'
import EditExerciseDialog from './EditExerciseDialog.vue'
import ArchiveExerciseDialog from './ArchiveExerciseDialog.vue'

defineProps<{ exercise: Exercise }>()
const emit = defineEmits<{ renamed: [id: string] }>()

const showEdit = ref(false)
const showArchive = ref(false)

function onEditClose(id?: string): void {
  showEdit.value = false
  if (id) emit('renamed', id)
}
</script>

<style scoped>
.exercise-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  min-height: 52px;
}
.exercise-name {
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
