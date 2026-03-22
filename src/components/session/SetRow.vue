<template>
  <v-row align="center" class="set-row mb-2" no-gutters>
    <!-- Set number -->
    <v-col cols="1" class="text-center text-body-2 text-medium-emphasis">
      {{ setNumber }}
    </v-col>

    <!-- New weight -->
    <v-col cols="5" class="px-1">
      <div class="d-flex align-center">
        <v-btn
          icon="mdi-minus"
          size="small"
          variant="text"
          :disabled="!newWeight"
          @click="adjustWeight(-2.5)"
        />
        <v-text-field
          :model-value="newWeight ?? ''"
          type="number"
          density="compact"
          variant="outlined"
          hide-details
          class="flex-grow-1"
          style="min-width: 4ch"
          min="0.5"
          step="2.5"
          @focus="onWeightFocus"
          @update:model-value="onWeightInput"
        />
        <v-btn
          icon="mdi-plus"
          size="small"
          variant="text"
          @click="adjustWeight(2.5)"
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
    <v-col cols="5" class="px-1">
      <div class="d-flex align-center">
        <v-btn
          icon="mdi-minus"
          size="small"
          variant="text"
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
          @click="adjustReps(1)"
        />
      </div>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
const props = defineProps<{
  setNumber: number
  newWeight?: number
  newReps?: number
  bumpIt?: boolean
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

function onWeightFocus(): void {
  if (props.newWeight === undefined && props.prevNewWeight !== undefined) {
    emit('update:newWeight', props.prevNewWeight)
  }
}

function onRepsFocus(): void {
  if (props.newReps === undefined && props.prevNewReps !== undefined) {
    emit('update:newReps', props.prevNewReps)
  }
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
  const current = props.newWeight ?? 0
  const next = Math.max(0.5, Math.round((current + delta) * 10) / 10)
  emit('update:newWeight', next)
}

function adjustReps(delta: number): void {
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
</style>
