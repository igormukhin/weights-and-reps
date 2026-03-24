<template>
  <v-row align="center" class="set-row mb-2" no-gutters>
    <!-- Set number -->
    <v-col cols="1" class="text-center text-body-2 text-medium-emphasis">
      {{ setNumber }}
    </v-col>

    <!-- New weight -->
    <v-col cols="5" class="px-1">
      <v-number-input
        :model-value="newWeight ?? null"
        control-variant="split"
        density="compact"
        variant="outlined"
        inset
        hide-details
        :step="step"
        :precision="1"
        @update:model-value="onWeightInput"
        @update:focused="onWeightFocused"
      />
    </v-col>

    <!-- BumpIt label toggle -->
    <v-col cols="1" class="d-flex align-center justify-center">
      <v-btn
        variant="text"
        :style="{ opacity: bumpIt ? 1 : 0.25 }"
        @click="emit('update:bumpIt', !bumpIt)"
      >🆙</v-btn>
    </v-col>

    <!-- New reps -->
    <v-col cols="5" class="px-1">
      <v-number-input
        :model-value="newReps ?? null"
        control-variant="split"
        density="compact"
        variant="outlined"
        inset
        hide-details
        :min="1"
        :step="1"
        :precision="0"
        @update:model-value="onRepsInput"
        @update:focused="onRepsFocused"
      />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  setNumber: number
  newWeight?: number
  newReps?: number
  bumpIt?: boolean
  weightStep?: number
  /** New weight from the set immediately above this one (for prefill). */
  prevNewWeight?: number
  /** New reps from the set immediately above this one (for prefill). */
  prevNewReps?: number
}>()

const emit = defineEmits<{
  'update:newWeight': [value: number | null]
  'update:newReps': [value: number | null]
  'update:bumpIt': [value: boolean]
}>()

const step = computed(() => props.weightStep ?? 2.5)

function onWeightFocused(focused: boolean): void {
  if (focused && props.newWeight === undefined && props.prevNewWeight !== undefined) {
    emit('update:newWeight', props.prevNewWeight)
  }
}

function onRepsFocused(focused: boolean): void {
  if (focused && props.newReps === undefined && props.prevNewReps !== undefined) {
    emit('update:newReps', props.prevNewReps)
  }
}

function onWeightInput(value: number | null): void {
  emit('update:newWeight', value)
}

function onRepsInput(value: number | null): void {
  emit('update:newReps', value === null ? null : Math.round(value))
}
</script>

<style scoped>
.set-row {
  min-height: 56px;
}

.set-row :deep(.v-field) {
  --v-field-padding-start: 8px;
  --v-field-padding-end: 8px;
}

.set-row :deep(.v-number-input__control .v-btn) {
  width: 36px;
  height: 36px;
}

.set-row :deep(.v-number-input input) {
  text-align: right;
}
</style>
