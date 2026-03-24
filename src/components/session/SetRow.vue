<template>
  <v-row align="center" class="set-row mb-2" no-gutters>
    <!-- Set number -->
    <v-col cols="1" class="text-center text-body-2 text-medium-emphasis">
      {{ setNumber }}
    </v-col>

    <!-- New weight -->
    <v-col cols="6" class="px-1">
      <div class="d-flex align-center" @focusout="onWeightGroupFocusOut">
        <v-btn
          icon="mdi-minus"
          size="small"
          variant="text"
          :class="{ 'adj-btn--hidden': !weightFocused }"
          class="adj-btn"
          :disabled="newWeight == null"
          @click="adjustWeight(-step)"
        />
        <v-text-field
          :model-value="newWeight ?? ''"
          type="number"
          density="compact"
          variant="outlined"
          hide-details
          class="flex-grow-1"
          style="min-width: 4ch"
          :step="step"
          @focus="onWeightFocus"
          @update:model-value="onWeightInput"
        />
        <v-btn
          icon="mdi-plus"
          size="small"
          variant="text"
          :class="{ 'adj-btn--hidden': !weightFocused }"
          class="adj-btn"
          @click="adjustWeight(step)"
        />
      </div>
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
    <v-col cols="4" class="px-1">
      <div class="d-flex align-center" @focusout="onRepsGroupFocusOut">
        <v-btn
          icon="mdi-minus"
          size="small"
          variant="text"
          :class="{ 'adj-btn--hidden': !repsFocused }"
          class="adj-btn"
          :disabled="!newReps"
          @click="adjustReps(-1)"
        />
        <v-text-field
          :model-value="newReps ?? ''"
          type="number"
          density="compact"
          variant="outlined"
          hide-details
          class="flex-grow-1 reps-field"
          style="min-width: 2ch"
          min="1"
          step="1"
          @focus="onRepsFocus"
          @update:model-value="onRepsInput"
        />
        <v-btn
          icon="mdi-plus"
          size="small"
          variant="text"
          :class="{ 'adj-btn--hidden': !repsFocused }"
          class="adj-btn"
          @click="adjustReps(1)"
        />
      </div>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

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

const weightFocused = ref(false)
const repsFocused = ref(false)
let weightHideTimer: ReturnType<typeof setTimeout> | null = null
let repsHideTimer: ReturnType<typeof setTimeout> | null = null

function onWeightFocus(): void {
  if (weightHideTimer) { clearTimeout(weightHideTimer); weightHideTimer = null }
  weightFocused.value = true
  repsFocused.value = false
  if (props.newWeight === undefined && props.prevNewWeight !== undefined) {
    emit('update:newWeight', props.prevNewWeight)
  }
}

function onWeightGroupFocusOut(e: FocusEvent): void {
  if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return
  weightHideTimer = setTimeout(() => { weightFocused.value = false }, 200)
}

function onRepsFocus(): void {
  if (repsHideTimer) { clearTimeout(repsHideTimer); repsHideTimer = null }
  repsFocused.value = true
  weightFocused.value = false
  if (props.newReps === undefined && props.prevNewReps !== undefined) {
    emit('update:newReps', props.prevNewReps)
  }
}

function onRepsGroupFocusOut(e: FocusEvent): void {
  if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return
  repsHideTimer = setTimeout(() => { repsFocused.value = false }, 200)
}

function onWeightInput(value: string | number): void {
  const num = Number(value)
  emit('update:newWeight', isNaN(num) || value === '' ? null : num)
}

function onRepsInput(value: string | number): void {
  const num = Number(value)
  emit('update:newReps', isNaN(num) || value === '' ? null : Math.round(num))
}

function adjustWeight(delta: number): void {
  if (weightHideTimer) { clearTimeout(weightHideTimer); weightHideTimer = null }
  const current = props.newWeight ?? 0
  const next = Math.round((current + delta) * 10) / 10
  emit('update:newWeight', next)
}

const step = computed(() => props.weightStep ?? 2.5)

function adjustReps(delta: number): void {
  if (repsHideTimer) { clearTimeout(repsHideTimer); repsHideTimer = null }
  const current = props.newReps ?? 0
  const next = Math.max(1, current + delta)
  emit('update:newReps', next)
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

.reps-field :deep(input) {
  text-align: right;
}

.adj-btn {
  transition: opacity 0.15s ease;
}

.adj-btn--hidden {
  opacity: 0;
  pointer-events: none;
}
</style>
