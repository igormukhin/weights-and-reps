# Exercise Groups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the flat exercise list on the home screen into collapsible accordion groups derived from the exercise name prefix before the first colon.

**Architecture:** A pure utility (`exerciseGroups.ts`) handles name parsing and group computation. A new `ExerciseGroupedList.vue` component consumes `Exercise[]`, uses the utility to compute groups, and renders them as a Vuetify `v-expansion-panels` accordion. `ExercisesView.vue` swaps its `v-list` for `<ExerciseGroupedList>`.

**Tech Stack:** TypeScript 5.x strict, Vue 3 Composition API, Vuetify 3 (`v-expansion-panels`), Vitest (node environment)

---

### Task 0: Create feature branch

- [ ] **Step 1: Create and switch to feature branch**

```bash
git checkout -b feat/exercise-groups
```

---

### Task 1: Create exerciseGroups utility (failing tests first)

**Files:**
- Create: `src/utils/exerciseGroups.test.ts`
- Create: `src/utils/exerciseGroups.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/exerciseGroups.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import type { Exercise } from '@/types'
import { parseExerciseName, groupExercises } from './exerciseGroups'

function ex(id: string, name: string, position: number): Exercise {
  return { id, name, position, hidden: false, createdAt: null as unknown as Timestamp }
}

describe('parseExerciseName', () => {
  it('splits on first colon and trims both parts', () => {
    expect(parseExerciseName('Chest: Bench Press')).toEqual({ group: 'Chest', shortName: 'Bench Press' })
  })

  it('trims whitespace around colon', () => {
    expect(parseExerciseName('Back :  Pull-up  ')).toEqual({ group: 'Back', shortName: 'Pull-up' })
  })

  it('uses only the first colon as the split point', () => {
    expect(parseExerciseName('A: B: C')).toEqual({ group: 'A', shortName: 'B: C' })
  })

  it('returns ungrouped when no colon present', () => {
    expect(parseExerciseName('Plank')).toEqual({ group: '(ungrouped)', shortName: 'Plank' })
  })

  it('returns ungrouped for empty string', () => {
    expect(parseExerciseName('')).toEqual({ group: '(ungrouped)', shortName: '' })
  })
})

describe('groupExercises', () => {
  it('returns empty array for empty input', () => {
    expect(groupExercises([])).toEqual([])
  })

  it('groups exercises by prefix and sorts groups alphabetically', () => {
    const exercises = [
      ex('1', 'Chest: Bench Press', 1),
      ex('2', 'Back: Pull-up', 2),
      ex('3', 'Chest: Cable Crossover', 3),
      ex('4', 'Back: Row', 4),
    ]
    const groups = groupExercises(exercises)
    expect(groups).toHaveLength(2)
    expect(groups[0].name).toBe('Back')
    expect(groups[0].exercises).toEqual([
      { id: '2', shortName: 'Pull-up' },
      { id: '4', shortName: 'Row' },
    ])
    expect(groups[1].name).toBe('Chest')
    expect(groups[1].exercises).toEqual([
      { id: '1', shortName: 'Bench Press' },
      { id: '3', shortName: 'Cable Crossover' },
    ])
  })

  it('places ungrouped exercises last', () => {
    const exercises = [
      ex('1', 'Chest: Bench Press', 1),
      ex('2', 'Plank', 2),
      ex('3', 'Abs: Crunch', 3),
    ]
    const groups = groupExercises(exercises)
    expect(groups).toHaveLength(3)
    expect(groups[0].name).toBe('Abs')
    expect(groups[1].name).toBe('Chest')
    expect(groups[2].name).toBe('(ungrouped)')
    expect(groups[2].exercises).toEqual([{ id: '2', shortName: 'Plank' }])
  })

  it('sorts named groups case-insensitively', () => {
    const exercises = [
      ex('1', 'legs: Squat', 1),
      ex('2', 'Arms: Curl', 2),
    ]
    const groups = groupExercises(exercises)
    expect(groups[0].name).toBe('Arms')
    expect(groups[1].name).toBe('legs')
  })

  it('preserves position-based order of exercises within a group', () => {
    const exercises = [
      ex('1', 'Chest: Bench Press', 1),
      ex('2', 'Chest: Incline Press', 2),
      ex('3', 'Chest: Cable Crossover', 3),
    ]
    const [group] = groupExercises(exercises)
    expect(group.exercises.map((e) => e.id)).toEqual(['1', '2', '3'])
  })

  it('handles all ungrouped exercises', () => {
    const exercises = [ex('1', 'Plank', 1), ex('2', 'Run', 2)]
    const groups = groupExercises(exercises)
    expect(groups).toHaveLength(1)
    expect(groups[0].name).toBe('(ungrouped)')
    expect(groups[0].exercises).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- exerciseGroups
```

Expected: FAIL — "Cannot find module './exerciseGroups'"

- [ ] **Step 3: Implement exerciseGroups.ts**

Create `src/utils/exerciseGroups.ts`:

```ts
import type { Exercise } from '@/types'

export interface ExerciseGroup {
  name: string
  exercises: { id: string; shortName: string }[]
}

export function parseExerciseName(name: string): { group: string; shortName: string } {
  const colonIndex = name.indexOf(':')
  if (colonIndex === -1) return { group: '(ungrouped)', shortName: name }
  return {
    group: name.slice(0, colonIndex).trim(),
    shortName: name.slice(colonIndex + 1).trim(),
  }
}

export function groupExercises(exercises: Exercise[]): ExerciseGroup[] {
  const map = new Map<string, { id: string; shortName: string }[]>()
  for (const ex of exercises) {
    const { group, shortName } = parseExerciseName(ex.name)
    if (!map.has(group)) map.set(group, [])
    map.get(group)!.push({ id: ex.id, shortName })
  }

  const named: ExerciseGroup[] = []
  let ungrouped: ExerciseGroup | null = null

  for (const [name, exs] of map) {
    if (name === '(ungrouped)') {
      ungrouped = { name, exercises: exs }
    } else {
      named.push({ name, exercises: exs })
    }
  }

  named.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  if (ungrouped) named.push(ungrouped)
  return named
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- exerciseGroups
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/exerciseGroups.ts src/utils/exerciseGroups.test.ts
git commit -m "feat: add exerciseGroups utility with tests"
```

---

### Task 2: Create ExerciseGroupedList component

**Files:**
- Create: `src/components/exercises/ExerciseGroupedList.vue`

- [ ] **Step 1: Create the component**

Create `src/components/exercises/ExerciseGroupedList.vue`:

```vue
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
```

- [ ] **Step 2: Run type check**

```bash
npm run lint
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/exercises/ExerciseGroupedList.vue
git commit -m "feat: add ExerciseGroupedList component"
```

---

### Task 3: Wire ExerciseGroupedList into ExercisesView

**Files:**
- Modify: `src/views/ExercisesView.vue`

- [ ] **Step 1: Update ExercisesView.vue**

Replace the `v-list` block and its import with `ExerciseGroupedList`. The full updated file:

```vue
<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-title>Weights &amp; Reps</v-app-bar-title>
    <template #append>
      <v-btn variant="text" @click="router.push('/exercises/edit')">Edit</v-btn>
      <v-btn :icon="mdiLogout" @click="handleSignOut" />
    </template>
  </v-app-bar>

  <v-main>
    <v-container>
      <div v-if="isLoading" class="d-flex justify-center mt-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <div v-else-if="exercises.length === 0" class="text-center mt-12">
        <v-icon size="64" color="medium-emphasis" :icon="mdiDumbbell" />
        <p class="text-h6 mt-4 text-medium-emphasis">No exercises yet</p>
        <p class="text-body-2 text-medium-emphasis">Tap Edit to add your first exercise</p>
      </div>

      <ExerciseGroupedList v-else :exercises="exercises" />
    </v-container>
  </v-main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { mdiDumbbell, mdiLogout } from '@mdi/js'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useExercisesStore } from '@/stores/exercises'
import { useSessionStore } from '@/stores/session'
import { signOut } from '@/services/auth'
import ExerciseGroupedList from '@/components/exercises/ExerciseGroupedList.vue'

const authStore = useAuthStore()
const exercisesStore = useExercisesStore()
const sessionStore = useSessionStore()
const router = useRouter()

const uid = authStore.currentUser!.uid
const isLoading = computed(() => exercisesStore.isLoading)
const exercises = computed(() => exercisesStore.exercises)

onMounted(async () => {
  await exercisesStore.loadExercises(uid)
})

async function handleSignOut(): Promise<void> {
  await signOut()
  exercisesStore.clear()
  sessionStore.clear()
  router.push('/login')
}
</script>
```

- [ ] **Step 2: Run type check and all tests**

```bash
npm run lint && npm test
```

Expected: No type errors, all tests pass

- [ ] **Step 3: Start dev server and verify in browser**

```bash
npm run dev
```

Open http://localhost:5173. Sign in, verify:
- Exercise list shows groups (collapsed by default)
- Tapping group header expands it, shows short names (part after colon)
- Opening a second group collapses the first
- Exercises without colons appear in `(ungrouped)` at the bottom
- Tapping an exercise navigates to its detail view

- [ ] **Step 4: Commit**

```bash
git add src/views/ExercisesView.vue
git commit -m "feat: use ExerciseGroupedList in ExercisesView"
```

---

### Task 4: Fix existing e2e tests broken by collapsed groups

Three "persists after reload" tests check exercise visibility on the home screen (`/exercises`). All seeded exercises have no colon → land in `(ungrouped)` → collapsed by default → assertions fail. Fix: expand the group first.

**Files:**
- Modify: `e2e/exercises/add-exercise.spec.ts`
- Modify: `e2e/exercises/rename-exercise.spec.ts`
- Modify: `e2e/exercises/reorder-exercises.spec.ts`

- [ ] **Step 1: Fix add-exercise.spec.ts**

In `e2e/exercises/add-exercise.spec.ts`, update the `'added exercise persists after page reload'` test:

```ts
test('added exercise persists after page reload', async ({ page }) => {
  await page.reload()
  await page.getByRole('button', { name: '(ungrouped)' }).click()
  await expect(page.locator('.exercise-name', { hasText: 'Bench Press' })).toBeVisible()
})
```

- [ ] **Step 2: Fix rename-exercise.spec.ts**

In `e2e/exercises/rename-exercise.spec.ts`, update the `'renamed exercise persists after page reload'` test:

```ts
test('renamed exercise persists after page reload', async ({ page }) => {
  await page.reload()
  await page.getByRole('button', { name: '(ungrouped)' }).click()
  await expect(page.locator('.exercise-name', { hasText: 'Romanian Deadlift' })).toBeVisible()
})
```

- [ ] **Step 3: Fix reorder-exercises.spec.ts**

In `e2e/exercises/reorder-exercises.spec.ts`, update the `'reordered list persists after page reload'` test:

```ts
test('reordered list persists after page reload', async ({ page }) => {
  await page.reload()
  await page.getByRole('button', { name: '(ungrouped)' }).click()
  const names = page.locator('.exercise-name')
  await expect(names.nth(0)).toHaveText('Deadlift')
  await expect(names.nth(1)).toHaveText('Bench Press')
  await expect(names.nth(2)).toHaveText('Squat')
})
```

- [ ] **Step 4: Run affected e2e tests**

```bash
npx playwright test e2e/exercises/add-exercise.spec.ts e2e/exercises/rename-exercise.spec.ts e2e/exercises/reorder-exercises.spec.ts
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add e2e/exercises/add-exercise.spec.ts e2e/exercises/rename-exercise.spec.ts e2e/exercises/reorder-exercises.spec.ts
git commit -m "fix: expand ungrouped panel in reload e2e tests"
```

---

### Task 5: Add e2e tests for grouping behavior

**Files:**
- Create: `e2e/exercises/exercise-groups.spec.ts`

- [ ] **Step 1: Create the test file**

Create `e2e/exercises/exercise-groups.spec.ts`:

```ts
import { test, expect } from '@playwright/test'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'

// Tests share suite-level state. Serial mode ensures ordering.
test.describe.configure({ mode: 'serial' })

test.describe('Exercise groups', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
      await seedExercise(page, 'Chest: Bench Press', 1)
      await seedExercise(page, 'Back: Pull-up', 2)
      await seedExercise(page, 'Chest: Incline Press', 3)
      await seedExercise(page, 'Plank', 4)
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await expect(page).toHaveURL('/exercises')
  })

  test('all groups are collapsed on load', async ({ page }) => {
    await expect(page.locator('.exercise-name', { hasText: 'Bench Press' })).not.toBeVisible()
    await expect(page.locator('.exercise-name', { hasText: 'Pull-up' })).not.toBeVisible()
    await expect(page.locator('.exercise-name', { hasText: 'Plank' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Chest' })).toBeVisible()
    await expect(page.getByRole('button', { name: '(ungrouped)' })).toBeVisible()
  })

  test('expanding a group shows short names only', async ({ page }) => {
    await page.getByRole('button', { name: 'Chest' }).click()
    await expect(page.locator('.exercise-name', { hasText: 'Bench Press' })).toBeVisible()
    await expect(page.locator('.exercise-name', { hasText: 'Incline Press' })).toBeVisible()
    await expect(page.locator('.exercise-name', { hasText: 'Chest: Bench Press' })).not.toBeVisible()
  })

  test('opening a second group collapses the first', async ({ page }) => {
    await page.getByRole('button', { name: 'Chest' }).click()
    await expect(page.locator('.exercise-name', { hasText: 'Bench Press' })).toBeVisible()

    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.locator('.exercise-name', { hasText: 'Pull-up' })).toBeVisible()
    await expect(page.locator('.exercise-name', { hasText: 'Bench Press' })).not.toBeVisible()
  })

  test('named groups appear alphabetically before ungrouped', async ({ page }) => {
    const panels = page.locator('.v-expansion-panel-title')
    await expect(panels.nth(0)).toContainText('Back')
    await expect(panels.nth(1)).toContainText('Chest')
    await expect(panels.nth(2)).toContainText('(ungrouped)')
  })

  test('ungrouped group contains exercises without colons', async ({ page }) => {
    await page.getByRole('button', { name: '(ungrouped)' }).click()
    await expect(page.locator('.exercise-name', { hasText: 'Plank' })).toBeVisible()
  })
})
```

- [ ] **Step 2: Run new e2e tests**

```bash
npx playwright test e2e/exercises/exercise-groups.spec.ts
```

Expected: All 5 tests PASS

- [ ] **Step 3: Run full e2e suite to check for regressions**

```bash
npx playwright test
```

Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add e2e/exercises/exercise-groups.spec.ts
git commit -m "test: add e2e tests for exercise groups"
```
