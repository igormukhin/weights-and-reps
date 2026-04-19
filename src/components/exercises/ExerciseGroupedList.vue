<template>
  <v-expansion-panels>
    <v-expansion-panel
      v-for="group in groups"
      :key="group.name"
      :title="group.name"
    >
      <v-expansion-panel-text class="pa-0">
        <v-list lines="one" class="pa-0">
          <v-list-item
            v-for="exercise in group.exercises"
            :key="exercise.id"
            class="exercise-item pa-0"
            :ripple="false"
            @click="router.push(`/exercises/${exercise.id}`)"
          >
            <v-list-item-title class="exercise-name">
              {{ exercise.shortName }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Exercise } from '@/types'
import { groupExercises } from '@/utils/exerciseGroups'

const props = defineProps<{ exercises: Exercise[] }>()
const router = useRouter()

const groups = computed(() => groupExercises(props.exercises))
</script>

<style scoped>
:deep(.v-expansion-panel) {
  border-radius: 0;
}
:deep(.v-expansion-panel-title) {
  padding-inline: 16px;
  border-radius: 0;
  font-weight: 700;
  background-color: rgb(var(--v-theme-surface-light));
}
:deep(.v-expansion-panel-title__overlay) {
  background-color: unset;
}
:deep(.v-expansion-panel--active .v-expansion-panel-title) {
  background-color: rgba(var(--v-theme-primary), 0.2);
}
:deep(.v-expansion-panel--active:not(:first-child)),
:deep(.v-expansion-panel--active + .v-expansion-panel) {
  margin-top: 0;
}
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
</style>
