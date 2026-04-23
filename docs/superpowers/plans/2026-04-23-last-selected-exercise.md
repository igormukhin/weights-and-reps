# Last Selected Exercise Highlight — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the user returns to the home screen, the exercise they last tapped has its group panel open, is scrolled into view, and is highlighted with a primary-color accent border and tint.

**Architecture:** `lastSelectedExerciseId` lives in the exercises Pinia store, synced to `sessionStorage`. `ExerciseGroupedList` reads it on mount to open the correct group and scroll to the item. It uses `onBeforeRouteLeave` to clear the value when navigating away to any route other than `exercise-detail` (so tapping an exercise sets the value immediately before routing, and it survives the navigation).

**Tech Stack:** Vue 3 (Composition API), Pinia, Vue Router 4, Vuetify 3, Playwright (e2e tests)

---

## File Map

| File | What changes |
|------|-------------|
| `src/stores/exercises.ts` | Add `lastSelectedExerciseId` ref (sessionStorage-backed), `setLastSelected`, `clearLastSelected` |
| `src/components/exercises/ExerciseGroupedList.vue` | Add `v-model` on panels, `selectExercise` handler, highlight class + CSS, template ref + scroll, `onBeforeRouteLeave` clear |
| `e2e/exercises/last-selected-exercise.spec.ts` | New: 3 e2e tests covering highlight-on-return, sessionStorage persistence, and switching exercises |

---

## Task 1: Write failing e2e tests

**Files:**
- Create: `e2e/exercises/last-selected-exercise.spec.ts`

- [ ] **Step 1: Create the test file**

```typescript
// e2e/exercises/last-selected-exercise.spec.ts
import { test, expect } from '@playwright/test'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'

test.describe.configure({ mode: 'serial' })

let chestBenchId: string
let chestInclineId: string

test.describe('Last selected exercise', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
      chestBenchId = await seedExercise(page, 'Chest: Bench Press', 1)
      chestInclineId = await seedExercise(page, 'Chest: Incline Press', 2)
      await seedExercise(page, 'Back: Pull-up', 3)
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await expect(page).toHaveURL('/exercises')
  })

  test('returning from exercise opens its group and highlights it', async ({ page }) => {
    await page.getByRole('button', { name: 'Chest' }).click()
    await page.locator('.exercise-name', { hasText: 'Bench Press' }).click()
    await page.waitForURL(`/exercises/${chestBenchId}`)

    await page.goBack()
    await page.waitForURL('/exercises')

    await expect(page.locator('.exercise-name', { hasText: 'Bench Press' })).toBeVisible()
    const selectedRow = page.locator('.exercise-item.selected')
    await expect(selectedRow).toContainText('Bench Press')
    await expect(selectedRow).toBeInViewport()
  })

  test('highlight persists after page refresh', async ({ page }) => {
    await page.getByRole('button', { name: 'Chest' }).click()
    await page.locator('.exercise-name', { hasText: 'Bench Press' }).click()
    await page.waitForURL(`/exercises/${chestBenchId}`)

    await page.goBack()
    await page.waitForURL('/exercises')
    await page.reload()
    await page.waitForURL('/exercises')

    await expect(page.locator('.exercise-name', { hasText: 'Bench Press' })).toBeVisible()
    await expect(page.locator('.exercise-item.selected')).toContainText('Bench Press')
  })

  test('selecting a different exercise updates the highlight', async ({ page }) => {
    await page.getByRole('button', { name: 'Chest' }).click()
    await page.locator('.exercise-name', { hasText: 'Bench Press' }).click()
    await page.waitForURL(`/exercises/${chestBenchId}`)
    await page.goBack()
    await page.waitForURL('/exercises')

    await page.locator('.exercise-name', { hasText: 'Incline Press' }).click()
    await page.waitForURL(`/exercises/${chestInclineId}`)
    await page.goBack()
    await page.waitForURL('/exercises')

    await expect(page.locator('.exercise-item.selected')).toContainText('Incline Press')
    await expect(page.locator('.exercise-item.selected')).not.toContainText('Bench Press')
  })
})
```

- [ ] **Step 2: Run tests to confirm they all fail**

```bash
npm run build:test && npx playwright test e2e/exercises/last-selected-exercise.spec.ts
```

Expected: all 3 tests FAIL — `.exercise-item.selected` does not exist yet.

- [ ] **Step 3: Commit the test file**

```bash
git add e2e/exercises/last-selected-exercise.spec.ts
git commit -m "test(e2e): add failing tests for last-selected exercise highlight"
```

---

## Task 2: Extend the exercises store

**Files:**
- Modify: `src/stores/exercises.ts`

- [ ] **Step 1: Add state and actions to the store**

Replace the contents of `src/stores/exercises.ts` with:

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Exercise } from '@/types'
import { getExercises } from '@/services/exercises'

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export const useExercisesStore = defineStore('exercises', () => {
  const exercises = ref<Exercise[]>([])
  const isLoading = ref(false)
  const lastLoadedAt = ref(0)
  const lastSelectedExerciseId = ref<string | null>(
    sessionStorage.getItem('lastSelectedExerciseId') ?? null,
  )

  async function loadExercises(uid: string, { force = false } = {}): Promise<void> {
    if (!force && lastLoadedAt.value > 0 && Date.now() - lastLoadedAt.value < CACHE_TTL_MS) {
      return
    }
    isLoading.value = true
    exercises.value = await getExercises(uid)
    lastLoadedAt.value = Date.now()
    isLoading.value = false
  }

  function getById(id: string): Exercise | undefined {
    return exercises.value.find((e) => e.id === id)
  }

  function clear(): void {
    exercises.value = []
    lastLoadedAt.value = 0
  }

  function setLastSelected(id: string): void {
    lastSelectedExerciseId.value = id
    sessionStorage.setItem('lastSelectedExerciseId', id)
  }

  function clearLastSelected(): void {
    lastSelectedExerciseId.value = null
    sessionStorage.removeItem('lastSelectedExerciseId')
  }

  return {
    exercises,
    isLoading,
    loadExercises,
    getById,
    clear,
    lastSelectedExerciseId,
    setLastSelected,
    clearLastSelected,
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/exercises.ts
git commit -m "feat: add lastSelectedExerciseId to exercises store with sessionStorage sync"
```

---

## Task 3: Update ExerciseGroupedList and make tests pass

**Files:**
- Modify: `src/components/exercises/ExerciseGroupedList.vue`

- [ ] **Step 1: Replace the component with the updated version**

Replace the full contents of `src/components/exercises/ExerciseGroupedList.vue` with:

```vue
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
import { computed, nextTick, onMounted, ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import type { Exercise } from '@/types'
import { groupExercises } from '@/utils/exerciseGroups'
import { useExercisesStore } from '@/stores/exercises'

const props = defineProps<{ exercises: Exercise[] }>()
const router = useRouter()
const exercisesStore = useExercisesStore()

const groups = computed(() => groupExercises(props.exercises))

const idx = groups.value.findIndex((g) =>
  g.exercises.some((e) => e.id === exercisesStore.lastSelectedExerciseId),
)
const openPanel = ref<number | undefined>(idx >= 0 ? idx : undefined)

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
  border-left: 3px solid rgb(var(--v-theme-primary));
  padding-left: 13px;
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
```

- [ ] **Step 2: Run the lint and type check**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Run e2e tests to confirm all 3 pass**

```bash
npm run build:test && npx playwright test e2e/exercises/last-selected-exercise.spec.ts
```

Expected: all 3 tests PASS.

- [ ] **Step 4: Run the full e2e suite to check for regressions**

```bash
npx playwright test
```

Expected: all tests pass. Pay special attention to `exercise-groups.spec.ts` — the existing "all groups are collapsed on load" test should still pass because `lastSelectedExerciseId` is `null` on a fresh session.

- [ ] **Step 5: Commit**

```bash
git add src/components/exercises/ExerciseGroupedList.vue
git commit -m "feat: highlight last selected exercise on home screen return"
```
