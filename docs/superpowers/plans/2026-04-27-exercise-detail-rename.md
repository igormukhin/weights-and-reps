# Exercise Detail Rename Button — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pen icon button to the app bar of `ExerciseDetailView` that opens the existing `EditExerciseDialog`, letting users rename an exercise without entering exercise list edit mode.

**Architecture:** Wire the existing `EditExerciseDialog` component into `ExerciseDetailView`. A single `showRenameDialog` ref gates the dialog. The app bar title is already bound to the reactive Pinia store value so it updates automatically after save.

**Tech Stack:** Vue 3 (Composition API), Vuetify 3, `@mdi/js`, Playwright (e2e)

---

### Task 1: Write the failing e2e test

**Files:**
- Create: `e2e/exercises/rename-exercise-from-detail.spec.ts`

- [ ] **Step 1: Create the test file**

```typescript
import { test, expect } from '../fixtures'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'
import { navigateToExercise } from '../fixtures/sessions'

test.describe.configure({ mode: 'serial' })

let exerciseId: string

test.describe('Rename exercise from detail view', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
      exerciseId = await seedExercise(page, 'Deadlift', 1)
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await navigateToExercise(page, exerciseId)
  })

  test('pen button opens rename dialog and updates app bar title', async ({ page }) => {
    await page.getByRole('button', { name: 'Rename exercise' }).click()
    await page.getByLabel('Exercise name').fill('Romanian Deadlift')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('.v-app-bar-title__content')).toContainText('Romanian Deadlift')
  })

  test('cancel rename leaves app bar title unchanged', async ({ page }) => {
    // After the previous test the exercise is named "Romanian Deadlift"
    await page.getByRole('button', { name: 'Rename exercise' }).click()
    await page.getByLabel('Exercise name').fill('Something Else')
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.locator('.v-app-bar-title__content')).toContainText('Romanian Deadlift')
    await expect(page.locator('.v-app-bar-title__content')).not.toContainText('Something Else')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx playwright test e2e/exercises/rename-exercise-from-detail.spec.ts --reporter=line
```

Expected: both tests FAIL — "pen button opens rename dialog and updates app bar title" fails because the button does not exist yet.

---

### Task 2: Implement the pen button and rename dialog in ExerciseDetailView

**Files:**
- Modify: `src/views/ExerciseDetailView.vue`

- [ ] **Step 1: Add `mdiPencil` to the icon import and import `EditExerciseDialog`**

In the `<script setup>` section, change:

```typescript
import { mdiArrowLeft, mdiDelete } from '@mdi/js'
import SetRow from '@/components/session/SetRow.vue'
import DeleteSessionDialog from '@/components/session/DeleteSessionDialog.vue'
```

to:

```typescript
import { mdiArrowLeft, mdiDelete, mdiPencil } from '@mdi/js'
import SetRow from '@/components/session/SetRow.vue'
import DeleteSessionDialog from '@/components/session/DeleteSessionDialog.vue'
import EditExerciseDialog from '@/components/exercises/EditExerciseDialog.vue'
```

- [ ] **Step 2: Add `showRenameDialog` ref**

After the existing `const showDeleteDialog = ref(false)` line, add:

```typescript
const showRenameDialog = ref(false)
```

- [ ] **Step 3: Add the pen button to the app bar's `#append` slot**

Replace the existing `<template #append>` block:

```html
<template #append>
  <!-- Save status indicator -->
  <v-chip
    v-if="saveStatus !== 'idle'"
    :color="statusColor"
    size="small"
    class="mr-2"
    label
  >
    {{ statusLabel }}
  </v-chip>
</template>
```

with:

```html
<template #append>
  <!-- Rename exercise button -->
  <v-btn
    :icon="mdiPencil"
    aria-label="Rename exercise"
    @click="showRenameDialog = true"
  />
  <!-- Save status indicator -->
  <v-chip
    v-if="saveStatus !== 'idle'"
    :color="statusColor"
    size="small"
    class="mr-2"
    label
  >
    {{ statusLabel }}
  </v-chip>
</template>
```

- [ ] **Step 4: Add `EditExerciseDialog` to the template**

After the closing `</v-app-bar>` tag (line 17), add:

```html
<EditExerciseDialog
  v-if="showRenameDialog && exercise"
  :exercise-id="exerciseId"
  :current-name="exercise.name"
  @close="showRenameDialog = false"
/>
```

- [ ] **Step 5: Run the e2e tests to verify they pass**

```bash
npx playwright test e2e/exercises/rename-exercise-from-detail.spec.ts --reporter=line
```

Expected: both tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/views/ExerciseDetailView.vue e2e/exercises/rename-exercise-from-detail.spec.ts
git commit -m "feat: add rename button to exercise detail app bar"
```
