<template>
  <v-list-item
    class="exercise-item pa-0"
    :ripple="false"
    @click="router.push(`/exercises/${exercise.id}`)"
  >
    <v-list-item-title class="exercise-name">
      {{ exercise.name }}
    </v-list-item-title>
  </v-list-item>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Exercise } from '@/types'

defineProps<{ exercise: Exercise }>()

const router = useRouter()
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
</style>
