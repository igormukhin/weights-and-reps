<template>
  <v-expansion-panels v-model="openPanel">
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
            :ref="(el) => setItemRef(exercise.id, el)"
            :class="['exercise-item', 'pa-0', { selected: exercise.id === exercisesStore.lastSelectedExerciseId }]"
            :ripple="false"
            @click="selectExercise(exercise.id)"
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
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import type { Exercise } from '@/types'
import { groupExercises } from '@/utils/exerciseGroups'
import { useExercisesStore } from '@/stores/exercises'

const props = defineProps<{ exercises: Exercise[] }>()
const router = useRouter()
const exercisesStore = useExercisesStore()

const groups = computed(() => groupExercises(props.exercises))

const openPanel = ref<number | undefined>(undefined)
watch(
  groups,
  (newGroups) => {
    if (!newGroups.length) return
    const idx = newGroups.findIndex((g) =>
      g.exercises.some((e) => e.id === exercisesStore.lastSelectedExerciseId),
    )
    openPanel.value = idx >= 0 ? idx : undefined
  },
  { immediate: true, once: true },
)

const selectedItemEl = ref<ComponentPublicInstance | null>(null)

function setItemRef(id: string, el: unknown): void {
  if (id === exercisesStore.lastSelectedExerciseId) {
    selectedItemEl.value = el as ComponentPublicInstance
  }
}

function selectExercise(id: string): void {
  exercisesStore.setLastSelected(id)
  router.push(`/exercises/${id}`)
}

onMounted(async () => {
  await nextTick()
  selectedItemEl.value?.$el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
})

onBeforeRouteLeave((to) => {
  if (to.name !== 'exercise-detail') {
    exercisesStore.clearLastSelected()
  }
})
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
:deep(.v-expansion-panel-text__wrapper) {
  padding-left: 16px;
  padding-right: 16px;
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
.exercise-item.selected {
  background: rgba(var(--v-theme-primary), 0.08);
  border-right: 3px solid rgb(var(--v-theme-primary));
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
