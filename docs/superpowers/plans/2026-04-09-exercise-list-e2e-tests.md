# Exercise List E2E Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add E2E tests for rename, hide, reorder, and insert-ordering operations on the exercise list, backed by a shared Firestore seeding fixture.

**Architecture:** Extend the existing emulator-based E2E pattern — expose Firestore write helpers on `window` (alongside the existing auth helpers), seed per-suite data in `beforeAll` via a new `seedExercise` fixture, and write four serial spec files each covering one operation's happy path, persistence, and cancel flow.

**Tech Stack:** Playwright, Firebase Emulator Suite (Firestore + Auth), Vite preview server, TypeScript

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/services/firebase.ts` | Expose `__e2eDb`, `__e2eAddDoc`, `__e2eCollection`, `__e2eServerTimestamp` on `window` in emulator mode |
| Modify | `src/components/exercises/ExerciseListItem.vue` | Add `data-testid="rename-exercise-btn"` and `data-testid="hide-exercise-btn"` |
| Create | `e2e/fixtures/exercises.ts` | `seedExercise(page, name, position)` — writes an exercise to Firestore emulator via page.evaluate |
| Create | `e2e/exercises/rename-exercise.spec.ts` | Rename: happy path, persistence, cancel |
| Create | `e2e/exercises/hide-exercise.spec.ts` | Hide: happy path, persistence, cancel |
| Create | `e2e/exercises/reorder-exercises.spec.ts` | Drag reorder: happy path, persistence |
| Create | `e2e/exercises/add-exercise-ordering.spec.ts` | Insert position: prefix match, no-match fallback |

---

### Task 1: Expose Firestore helpers on window for E2E use

**Files:**
- Modify: `src/services/firebase.ts`

The app already exposes `__e2eAuth` and `__e2eSignIn` on `window` in emulator mode. We need to also expose the Firestore `db` instance and three helper functions so `seedExercise` can write documents from `page.evaluate()`.

- [ ] **Step 1: Update the imports in `src/services/firebase.ts`**

Add `addDoc`, `collection`, and `serverTimestamp` to the existing `firebase/firestore` import:

```typescript
import {
  initializeFirestore,
  persistentLocalCache,
  memoryLocalCache,
  connectFirestoreEmulator,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore'
```

- [ ] **Step 2: Extend the emulator block to expose the new helpers**

The existing block ends with two `__e2eAuth`/`__e2eSignIn` lines. Add four more immediately after:

```typescript
if (useEmulator) {
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectAuthEmulator(auth, 'http://localhost:9099')
  // Expose for E2E test automation — allows page.evaluate() to sign in programmatically
  ;(window as unknown as Record<string, unknown>).__e2eAuth = auth
  ;(window as unknown as Record<string, unknown>).__e2eSignIn = signInWithEmailAndPassword
  // Expose for E2E fixture seeding — allows page.evaluate() to write Firestore documents
  ;(window as unknown as Record<string, unknown>).__e2eDb = db
  ;(window as unknown as Record<string, unknown>).__e2eAddDoc = addDoc
  ;(window as unknown as Record<string, unknown>).__e2eCollection = collection
  ;(window as unknown as Record<string, unknown>).__e2eServerTimestamp = serverTimestamp
}
```

- [ ] **Step 3: Verify the app still builds**

```bash
npm run build:test
```

Expected: build completes with no errors. (`build:test` sets `VITE_USE_FIREBASE_EMULATOR=true`.)

- [ ] **Step 4: Commit**

```bash
git add src/services/firebase.ts
git commit -m "feat(e2e): expose Firestore helpers on window for fixture seeding"
```

---

### Task 2: Add data-testid attributes to rename and hide buttons

**Files:**
- Modify: `src/components/exercises/ExerciseListItem.vue`

The pencil and eye-off icon buttons have no stable selector. Adding `data-testid` attributes is the Playwright-recommended approach and is consistent with `data-testid="add-exercise-fab"` already in the codebase.

- [ ] **Step 1: Add data-testid to the pencil button**

Find the pencil button (around line 22) and add the attribute:

```html
<v-btn
  v-show="isEditMode"
  icon="mdi-pencil-outline"
  size="small"
  variant="text"
  data-testid="rename-exercise-btn"
  @click.stop="showEdit = true"
/>
```

- [ ] **Step 2: Add data-testid to the eye-off button**

Find the eye-off button (around line 28) and add the attribute:

```html
<v-btn
  v-show="isEditMode"
  icon="mdi-eye-off-outline"
  size="small"
  variant="text"
  data-testid="hide-exercise-btn"
  @click.stop="showHide = true"
/>
```

- [ ] **Step 3: Verify the app still builds**

```bash
npm run build:test
```

Expected: build completes with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/exercises/ExerciseListItem.vue
git commit -m "feat(e2e): add data-testid to rename and hide buttons"
```

---

### Task 3: Create the seedExercise fixture

**Files:**
- Create: `e2e/fixtures/exercises.ts`

This fixture is called in `test.beforeAll` to write an exercise document directly into the Firestore emulator without going through the UI. It uses the `window.__e2e*` helpers exposed in Task 1. It assumes `signInAsTestUser(page)` has already been called (so the Firebase SDK is initialised and the user is authenticated).

- [ ] **Step 1: Create `e2e/fixtures/exercises.ts`**

```typescript
import type { Page } from '@playwright/test'

type WindowE2E = {
  __e2eAuth: { currentUser: { uid: string } }
  __e2eDb: unknown
  __e2eAddDoc: (ref: unknown, data: unknown) => Promise<unknown>
  __e2eCollection: (db: unknown, ...segments: string[]) => unknown
  __e2eServerTimestamp: () => unknown
}

/**
 * Writes an exercise document directly into the Firestore emulator.
 *
 * Prerequisites: signInAsTestUser(page) must have been called first so that
 * (a) the Firebase SDK is initialised, (b) the window.__e2e* helpers are
 * available, and (c) auth.currentUser is set.
 */
export async function seedExercise(page: Page, name: string, position: number): Promise<void> {
  await page.evaluate(
    async ([exerciseName, exercisePosition]) => {
      const w = window as unknown as WindowE2E
      const uid = w.__e2eAuth.currentUser.uid
      const ref = w.__e2eCollection(w.__e2eDb, 'users', uid, 'exercises')
      await w.__e2eAddDoc(ref, {
        name: exerciseName,
        position: exercisePosition,
        hidden: false,
        createdAt: w.__e2eServerTimestamp(),
      })
    },
    [name, position] as [string, number],
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run lint
```

Expected: no errors in `e2e/fixtures/exercises.ts`.

- [ ] **Step 3: Commit**

```bash
git add e2e/fixtures/exercises.ts
git commit -m "feat(e2e): add seedExercise fixture for Firestore seeding"
```

---

### Task 4: Rename exercise spec

**Files:**
- Create: `e2e/exercises/rename-exercise.spec.ts`

Three tests run serially sharing emulator state. After test 1 renames "Deadlift" to "Romanian Deadlift", tests 2 and 3 operate on "Romanian Deadlift".

- [ ] **Step 1: Create `e2e/exercises/rename-exercise.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'
import { signInAsTestUser } from '../fixtures/auth'
import { seedExercise } from '../fixtures/exercises'

// Tests share suite-level emulator state (test 1 renames the exercise; tests 2–3 rely on that).
// Serial mode ensures they run in order within a single browser context lifecycle.
test.describe.configure({ mode: 'serial' })

test.describe('Rename exercise', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await signInAsTestUser(page)
    await seedExercise(page, 'Deadlift', 1)
    await page.close()
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await expect(page).toHaveURL('/exercises')
  })

  test('renamed exercise appears in list', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit' }).click()

    // Scope to the list item containing exactly "Deadlift" to avoid matching
    // "Romanian Deadlift" after rename
    const item = page
      .locator('.exercise-item')
      .filter({ has: page.getByText('Deadlift', { exact: true }) })
    await item.locator('[data-testid="rename-exercise-btn"]').click()

    await page.getByLabel('Exercise name').fill('Romanian Deadlift')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.locator('.exercise-name', { hasText: 'Romanian Deadlift' })).toBeVisible()
    // "Deadlift" as exact text should no longer exist — "Romanian Deadlift" is a different string
    await expect(page.getByText('Deadlift', { exact: true })).not.toBeVisible()
  })

  test('renamed exercise persists after page reload', async ({ page }) => {
    await page.reload()
    await expect(page.locator('.exercise-name', { hasText: 'Romanian Deadlift' })).toBeVisible()
  })

  test('cancel rename leaves exercise name unchanged', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit' }).click()

    const item = page
      .locator('.exercise-item')
      .filter({ has: page.locator('.exercise-name', { hasText: 'Romanian Deadlift' }) })
    await item.locator('[data-testid="rename-exercise-btn"]').click()

    await page.getByLabel('Exercise name').fill('Something Else')
    await page.getByRole('button', { name: 'Cancel' }).click()

    await expect(page.locator('.exercise-name', { hasText: 'Romanian Deadlift' })).toBeVisible()
    await expect(page.locator('.exercise-name', { hasText: 'Something Else' })).not.toBeVisible()
  })
})
```

- [ ] **Step 2: Run the spec to verify it fails for the right reason (missing data-testid — Task 2 must be done first)**

Make sure Tasks 1–3 are already committed, then run:

```bash
npx playwright test e2e/exercises/rename-exercise.spec.ts --project=chromium
```

Expected: all 3 tests PASS (Tasks 1–3 provide all prerequisites).

- [ ] **Step 3: Commit**

```bash
git add e2e/exercises/rename-exercise.spec.ts
git commit -m "test(e2e): add rename exercise tests"
```

---

### Task 5: Hide exercise spec

**Files:**
- Create: `e2e/exercises/hide-exercise.spec.ts`

Three tests run serially. "Squat" is hidden in test 1 (so tests 2 and 3 cannot use it). "Pull-up" is untouched until test 3's cancel flow.

- [ ] **Step 1: Create `e2e/exercises/hide-exercise.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'
import { signInAsTestUser } from '../fixtures/auth'
import { seedExercise } from '../fixtures/exercises'

// Tests share suite-level emulator state. Serial mode ensures ordering.
test.describe.configure({ mode: 'serial' })

test.describe('Hide exercise', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await signInAsTestUser(page)
    await seedExercise(page, 'Squat', 1)
    await seedExercise(page, 'Pull-up', 2)
    await page.close()
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await expect(page).toHaveURL('/exercises')
  })

  test('hidden exercise disappears from list', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit' }).click()

    const item = page
      .locator('.exercise-item')
      .filter({ has: page.locator('.exercise-name', { hasText: 'Squat' }) })
    await item.locator('[data-testid="hide-exercise-btn"]').click()

    await page.getByRole('button', { name: 'Hide' }).click()

    await expect(page.locator('.exercise-name', { hasText: 'Squat' })).not.toBeVisible()
    await expect(page.locator('.exercise-name', { hasText: 'Pull-up' })).toBeVisible()
  })

  test('hidden exercise stays hidden after page reload', async ({ page }) => {
    await page.reload()
    await expect(page.locator('.exercise-name', { hasText: 'Squat' })).not.toBeVisible()
  })

  test('cancel hide leaves exercise in list', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit' }).click()

    const item = page
      .locator('.exercise-item')
      .filter({ has: page.locator('.exercise-name', { hasText: 'Pull-up' }) })
    await item.locator('[data-testid="hide-exercise-btn"]').click()

    await page.getByRole('button', { name: 'Cancel' }).click()

    await expect(page.locator('.exercise-name', { hasText: 'Pull-up' })).toBeVisible()
  })
})
```

- [ ] **Step 2: Run the spec**

```bash
npx playwright test e2e/exercises/hide-exercise.spec.ts --project=chromium
```

Expected: all 3 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add e2e/exercises/hide-exercise.spec.ts
git commit -m "test(e2e): add hide exercise tests"
```

---

### Task 6: Reorder exercises spec

**Files:**
- Create: `e2e/exercises/reorder-exercises.spec.ts`

Uses Playwright's `dragTo()` locator method, which dispatches the pointer events that SortableJS (used by vuedraggable) responds to. The drag handle (`.drag-handle`) must be the drag source.

- [ ] **Step 1: Create `e2e/exercises/reorder-exercises.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'
import { signInAsTestUser } from '../fixtures/auth'
import { seedExercise } from '../fixtures/exercises'

// Test 2 relies on state from test 1. Serial mode ensures ordering.
test.describe.configure({ mode: 'serial' })

test.describe('Reorder exercises', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await signInAsTestUser(page)
    await seedExercise(page, 'Bench Press', 1)
    await seedExercise(page, 'Squat', 2)
    await seedExercise(page, 'Deadlift', 3)
    await page.close()
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await expect(page).toHaveURL('/exercises')
  })

  test('dragged exercise appears in new position', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit' }).click()

    // Drag the "Deadlift" handle to the "Bench Press" item (drops before it)
    const deadliftHandle = page
      .locator('.exercise-item')
      .filter({ has: page.locator('.exercise-name', { hasText: 'Deadlift' }) })
      .locator('.drag-handle')

    const benchPressItem = page
      .locator('.exercise-item')
      .filter({ has: page.locator('.exercise-name', { hasText: 'Bench Press' }) })

    await deadliftHandle.dragTo(benchPressItem)

    // Verify new order: Deadlift, Bench Press, Squat
    const names = page.locator('.exercise-name')
    await expect(names.nth(0)).toHaveText('Deadlift')
    await expect(names.nth(1)).toHaveText('Bench Press')
    await expect(names.nth(2)).toHaveText('Squat')
  })

  test('reordered list persists after page reload', async ({ page }) => {
    await page.reload()

    const names = page.locator('.exercise-name')
    await expect(names.nth(0)).toHaveText('Deadlift')
    await expect(names.nth(1)).toHaveText('Bench Press')
    await expect(names.nth(2)).toHaveText('Squat')
  })
})
```

- [ ] **Step 2: Run the spec**

```bash
npx playwright test e2e/exercises/reorder-exercises.spec.ts --project=chromium
```

Expected: both tests PASS. If drag-and-drop flakes, see the note below.

> **Drag flake note:** If `dragTo` is unreliable, replace with a manual pointer sequence:
> ```typescript
> const src = await deadliftHandle.boundingBox()
> const tgt = await benchPressItem.boundingBox()
> await page.mouse.move(src!.x + src!.width / 2, src!.y + src!.height / 2)
> await page.mouse.down()
> await page.mouse.move(tgt!.x + tgt!.width / 2, tgt!.y + tgt!.height / 2, { steps: 10 })
> await page.mouse.up()
> ```

- [ ] **Step 3: Commit**

```bash
git add e2e/exercises/reorder-exercises.spec.ts
git commit -m "test(e2e): add reorder exercises tests"
```

---

### Task 7: Add-exercise ordering spec

**Files:**
- Create: `e2e/exercises/add-exercise-ordering.spec.ts`

Verifies that the `findInsertPosition` logic (already unit-tested in `exercisePosition.test.ts`) is correctly reflected in the rendered list. Does NOT re-test the insertion algorithm — only tests that the UI shows exercises in the computed order.

- [ ] **Step 1: Create `e2e/exercises/add-exercise-ordering.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'
import { signInAsTestUser } from '../fixtures/auth'
import { seedExercise } from '../fixtures/exercises'

// Test 2 relies on state from test 1 ("Bench Fly" is already in the list).
// Serial mode ensures ordering.
test.describe.configure({ mode: 'serial' })

test.describe('Add exercise ordering', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await signInAsTestUser(page)
    // Seed two exercises with clearly different prefixes
    await seedExercise(page, 'Bench Press', 1)
    await seedExercise(page, 'Squat', 2)
    await page.close()
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await expect(page).toHaveURL('/exercises')
  })

  test('new exercise inserts after longest-prefix match', async ({ page }) => {
    // "Bench Fly" shares "bench " with "Bench Press" → should appear right after it
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.locator('[data-testid="add-exercise-fab"]').click()
    await page.getByLabel('Exercise name').fill('Bench Fly')
    await page.getByRole('button', { name: 'Add' }).click()

    // Wait for dialog to close and list to update
    await expect(page.locator('.exercise-name', { hasText: 'Bench Fly' })).toBeVisible()

    // Verify order: Bench Press (0), Bench Fly (1), Squat (2)
    const names = page.locator('.exercise-name')
    await expect(names.nth(0)).toHaveText('Bench Press')
    await expect(names.nth(1)).toHaveText('Bench Fly')
    await expect(names.nth(2)).toHaveText('Squat')
  })

  test('new exercise with no prefix match appends to end', async ({ page }) => {
    // "Overhead Press" shares no prefix with "Bench Press", "Bench Fly", or "Squat"
    // → falls back to end of list
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.locator('[data-testid="add-exercise-fab"]').click()
    await page.getByLabel('Exercise name').fill('Overhead Press')
    await page.getByRole('button', { name: 'Add' }).click()

    await expect(page.locator('.exercise-name', { hasText: 'Overhead Press' })).toBeVisible()

    // Verify order: Bench Press (0), Bench Fly (1), Squat (2), Overhead Press (3)
    const names = page.locator('.exercise-name')
    await expect(names.nth(0)).toHaveText('Bench Press')
    await expect(names.nth(1)).toHaveText('Bench Fly')
    await expect(names.nth(2)).toHaveText('Squat')
    await expect(names.nth(3)).toHaveText('Overhead Press')
  })
})
```

- [ ] **Step 2: Run the spec**

```bash
npx playwright test e2e/exercises/add-exercise-ordering.spec.ts --project=chromium
```

Expected: both tests PASS.

- [ ] **Step 3: Commit**

```bash
git add e2e/exercises/add-exercise-ordering.spec.ts
git commit -m "test(e2e): add exercise insert-ordering tests"
```

---

### Task 8: Full suite verification

- [ ] **Step 1: Run the complete E2E suite**

```bash
npx playwright test --project=chromium
```

Expected: all tests PASS, including the pre-existing `add-exercise.spec.ts`.

- [ ] **Step 2: Confirm test count**

The output should show 5 spec files and 12 tests total:
- `add-exercise.spec.ts`: 2 tests (pre-existing)
- `rename-exercise.spec.ts`: 3 tests
- `hide-exercise.spec.ts`: 3 tests
- `reorder-exercises.spec.ts`: 2 tests
- `add-exercise-ordering.spec.ts`: 2 tests

- [ ] **Step 3: Final commit if any loose files remain**

```bash
git status
```

If nothing is uncommitted, you're done.
