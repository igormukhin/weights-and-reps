# Session Detail E2E Tests — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Playwright E2E tests for the session detail page covering read-only view, starting a session with pre-fill, editing sets, BumpIt toggle, and delete session.

**Architecture:** Five spec files under `e2e/session/` (one behavior per file, matching exercise test convention). A new `e2e/fixtures/sessions.ts` provides `seedSession`, `clearSessions`, and `navigateToExercise`. Two small changes to existing files: `src/services/firebase.ts` gets `setDoc`/`doc` helpers and a `__e2eClearSessions` function; `e2e/fixtures/exercises.ts` is updated so `seedExercise` returns the doc ID (needed to navigate to the detail page).

**Tech Stack:** Playwright 1.59, Firebase Firestore emulator, Vuetify 3, Vue 3

---

## File Map

| Action | File | Change |
|---|---|---|
| Modify | `src/services/firebase.ts` | Add `setDoc`, `doc` to imports; expose `__e2eSetDoc`, `__e2eDoc`, `__e2eClearSessions` on window |
| Modify | `src/views/ExerciseDetailView.vue` | Add `data-testid="add-set-fab"` and `data-testid="delete-session-fab"` to the two FABs |
| Modify | `e2e/fixtures/exercises.ts` | Return exercise doc ID from `seedExercise` |
| Create | `e2e/fixtures/sessions.ts` | `seedSession`, `clearSessions`, `navigateToExercise` |
| Create | `e2e/session/session-read-only.spec.ts` | Tests for read-only mode (last session display) |
| Create | `e2e/session/start-session.spec.ts` | Tests for starting a session + pre-fill |
| Create | `e2e/session/edit-sets.spec.ts` | Tests for adding/editing sets + auto-save |
| Create | `e2e/session/bump-it.spec.ts` | Tests for BumpIt toggle + persistence |
| Create | `e2e/session/delete-session.spec.ts` | Tests for delete session flow |

---

### Task 1: Extend `firebase.ts` emulator helpers

**Files:**
- Modify: `src/services/firebase.ts`

- [ ] **Step 1: Add `setDoc` and `doc` to the Firestore import**

In `src/services/firebase.ts`, update the `firebase/firestore` import block:

```ts
import {
  initializeFirestore,
  persistentLocalCache,
  memoryLocalCache,
  connectFirestoreEmulator,
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  deleteDoc,
  setDoc,
  doc,
} from 'firebase/firestore'
```

- [ ] **Step 2: Expose the new helpers and `clearSessions` in the emulator block**

Inside the `if (useEmulator) { ... }` block, after the existing `__e2eClearExercises` lines, add:

```ts
  ;(window as unknown as Record<string, unknown>).__e2eSetDoc = setDoc
  ;(window as unknown as Record<string, unknown>).__e2eDoc = doc
  const clearSessions = async (exerciseId: string): Promise<void> => {
    if (!auth.currentUser) return
    const uid = auth.currentUser.uid
    const snap = await getDocs(
      collection(db, 'users', uid, 'exercises', exerciseId, 'sessions'),
    )
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
  }
  ;(window as unknown as Record<string, unknown>).__e2eClearSessions = clearSessions
```

- [ ] **Step 3: Verify the build still passes**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/services/firebase.ts
git commit -m "feat(e2e): expose setDoc, doc, clearSessions on window for E2E fixtures"
```

---

### Task 2: Add `data-testid` attributes to session FABs

**Files:**
- Modify: `src/views/ExerciseDetailView.vue`

The add-set and delete-session FABs are icon-only buttons with no text, making them impossible to select reliably by role. Adding `data-testid` attributes mirrors the existing `add-exercise-fab` pattern.

- [ ] **Step 1: Add `data-testid="add-set-fab"` to the add set button**

Find this block in `ExerciseDetailView.vue` (around line 99):

```html
  <!-- Add set FAB — only in edit mode -->
  <v-btn
    v-if="hasTodaySession"
    color="primary"
    icon="mdi-plus"
    size="large"
    position="fixed"
    location="bottom right"
    class="ma-4"
    @click="addSet"
  />
```

Change to:

```html
  <!-- Add set FAB — only in edit mode -->
  <v-btn
    v-if="hasTodaySession"
    data-testid="add-set-fab"
    color="primary"
    icon="mdi-plus"
    size="large"
    position="fixed"
    location="bottom right"
    class="ma-4"
    @click="addSet"
  />
```

- [ ] **Step 2: Add `data-testid="delete-session-fab"` to the delete button**

Find this block (around line 110):

```html
  <!-- Delete session FAB — shown once session is persisted or has unsaved data -->
  <v-btn
    v-if="showDeleteButton"
    color="error"
    icon="mdi-delete"
    size="large"
    position="fixed"
    location="bottom left"
    class="ma-4"
    @click="showDeleteDialog = true"
  />
```

Change to:

```html
  <!-- Delete session FAB — shown once session is persisted or has unsaved data -->
  <v-btn
    v-if="showDeleteButton"
    data-testid="delete-session-fab"
    color="error"
    icon="mdi-delete"
    size="large"
    position="fixed"
    location="bottom left"
    class="ma-4"
    @click="showDeleteDialog = true"
  />
```

- [ ] **Step 3: Commit**

```bash
git add src/views/ExerciseDetailView.vue
git commit -m "feat(e2e): add data-testid to session FABs"
```

---

### Task 3: Update `seedExercise` to return the exercise ID

**Files:**
- Modify: `e2e/fixtures/exercises.ts`

Session tests need to navigate to `/exercises/:id`, which requires knowing the exercise document ID produced by `addDoc`.

- [ ] **Step 1: Update the function signature and return value**

Replace the entire `seedExercise` function:

```ts
/**
 * Writes an exercise document directly into the Firestore emulator.
 * Returns the new exercise document ID.
 *
 * Prerequisites: signInAsTestUser(page) must have been called first.
 */
export async function seedExercise(page: Page, name: string, position: number): Promise<string> {
  return await page.evaluate(
    async ([exerciseName, exercisePosition]) => {
      const w = window as unknown as WindowE2E
      const uid = w.__e2eAuth.currentUser?.uid
      if (!uid) throw new Error('seedExercise: no authenticated user — call signInAsTestUser first')
      const ref = w.__e2eCollection(w.__e2eDb, 'users', uid, 'exercises')
      const docRef = await w.__e2eAddDoc(ref, {
        name: exerciseName,
        position: exercisePosition,
        hidden: false,
        createdAt: w.__e2eServerTimestamp(),
      })
      return (docRef as { id: string }).id
    },
    [name, position] as [string, number],
  )
}
```

- [ ] **Step 2: Verify existing exercise tests still compile**

```bash
npm run lint
```

Expected: no errors. (Existing callers that ignore the return value still compile fine — void and string are compatible at call sites that discard the result.)

- [ ] **Step 3: Commit**

```bash
git add e2e/fixtures/exercises.ts
git commit -m "feat(e2e): return exercise ID from seedExercise"
```

---

### Task 4: Create `e2e/fixtures/sessions.ts`

**Files:**
- Create: `e2e/fixtures/sessions.ts`

- [ ] **Step 1: Create the file**

```ts
import type { Page } from '@playwright/test'

type WindowE2E = {
  __e2eAuth: { currentUser: { uid: string } }
  __e2eDb: unknown
  __e2eSetDoc: (ref: unknown, data: unknown) => Promise<void>
  __e2eDoc: (db: unknown, ...segments: string[]) => unknown
  __e2eServerTimestamp: () => unknown
  __e2eClearSessions: (exerciseId: string) => Promise<void>
}

export interface SeedSet {
  weight: number
  reps: number
  bumpIt?: boolean
}

/**
 * Writes a session document directly into the Firestore emulator.
 *
 * Prerequisites: signInAsTestUser(page) must have been called first.
 */
export async function seedSession(
  page: Page,
  exerciseId: string,
  dateStr: string,
  sets: SeedSet[],
): Promise<void> {
  await page.evaluate(
    async ([exId, date, sessionSets]) => {
      const w = window as unknown as WindowE2E
      const uid = w.__e2eAuth.currentUser?.uid
      if (!uid) throw new Error('seedSession: no authenticated user — call signInAsTestUser first')
      const ref = w.__e2eDoc(w.__e2eDb, 'users', uid, 'exercises', exId, 'sessions', date)
      await w.__e2eSetDoc(ref, {
        date,
        sets: sessionSets,
        updatedAt: w.__e2eServerTimestamp(),
      })
    },
    [exerciseId, dateStr, sets] as [string, string, SeedSet[]],
  )
}

/**
 * Deletes all session documents for the given exercise from the Firestore emulator.
 *
 * Prerequisites: signInAsTestUser(page) must have been called first.
 */
export async function clearSessions(page: Page, exerciseId: string): Promise<void> {
  await page.evaluate(async (exId) => {
    const w = window as unknown as { __e2eClearSessions?: (id: string) => Promise<void> }
    if (!w.__e2eClearSessions) {
      throw new Error('clearSessions: __e2eClearSessions not found — ensure emulator build')
    }
    await w.__e2eClearSessions(exId)
  }, exerciseId)
}

/**
 * Navigates to the exercise detail page and waits for the URL to settle.
 * Each test's own assertions handle waiting for specific content.
 */
export async function navigateToExercise(page: Page, exerciseId: string): Promise<void> {
  await page.goto(`/exercises/${exerciseId}`)
  await page.waitForURL(`/exercises/${exerciseId}`)
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add e2e/fixtures/sessions.ts
git commit -m "feat(e2e): add sessions fixture (seedSession, clearSessions, navigateToExercise)"
```

---

### Task 5: `session-read-only.spec.ts`

**Files:**
- Create: `e2e/session/session-read-only.spec.ts`

Tests read-only mode: the page shown when no today session exists. Seeds one past session, then verifies the last training date, set table, and "Pump it!" button are shown.

- [ ] **Step 1: Create the spec file**

```ts
import { test, expect } from '@playwright/test'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'
import { seedSession, clearSessions, navigateToExercise } from '../fixtures/sessions'

// Selectors:
//   Last training date:  text matching 'Last training:' paragraph
//   Set table rows:      table tbody tr  (read-only session table)
//   Pump it button:      role=button[name="Pump it!"]

test.describe.configure({ mode: 'serial' })

const PAST_DATE = '2020-01-15'
const PAST_SETS = [
  { weight: 80, reps: 8 },
  { weight: 80, reps: 7 },
]

let exerciseId: string

test.describe('Session read-only mode', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
      exerciseId = await seedExercise(page, 'Bench Press', 1)
      await clearSessions(page, exerciseId)
      await seedSession(page, exerciseId, PAST_DATE, PAST_SETS)
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await navigateToExercise(page, exerciseId)
  })

  test('shows last training date', async ({ page }) => {
    await expect(page.locator('text=Last training:')).toBeVisible()
  })

  test('shows last session sets in the table', async ({ page }) => {
    const rows = page.locator('table tbody tr')
    await expect(rows).toHaveCount(2)
    // First row: weight 80.0 kg and 8 reps
    await expect(rows.nth(0)).toContainText('80')
    await expect(rows.nth(0)).toContainText('8')
  })

  test('"Pump it!" button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Pump it!' })).toBeVisible()
  })
})
```

- [ ] **Step 2: Run the spec**

```bash
npx playwright test e2e/session/session-read-only.spec.ts --project=chromium
```

Expected: 3 tests pass. If a test fails due to a formatting mismatch (e.g., German locale in the table), adjust the `toContainText` matcher to use a regex like `/80/`.

- [ ] **Step 3: Commit**

```bash
git add e2e/session/session-read-only.spec.ts
git commit -m "feat(e2e): add session read-only mode tests"
```

---

### Task 6: `start-session.spec.ts`

**Files:**
- Create: `e2e/session/start-session.spec.ts`

Tests that "Pump it!" enters edit mode with set rows pre-filled from the last session, and that after an edit+save the values persist across a reload.

- [ ] **Step 1: Create the spec file**

```ts
import { test, expect } from '@playwright/test'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'
import { seedSession, clearSessions, navigateToExercise } from '../fixtures/sessions'

// Selectors:
//   Pump it button:  role=button[name="Pump it!"]
//   Set rows:        .set-row
//   Weight input:    .set-row >> nth=0 >> input >> nth=0
//   Reps input:      .set-row >> nth=0 >> input >> nth=1
//   Saved chip:      text=Saved

test.describe.configure({ mode: 'serial' })

const PAST_DATE = '2020-01-15'
const PAST_SETS = [
  { weight: 80, reps: 8 },
  { weight: 75, reps: 10 },
]

let exerciseId: string

test.describe('Start session', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
      exerciseId = await seedExercise(page, 'Squat', 1)
      await clearSessions(page, exerciseId)
      await seedSession(page, exerciseId, PAST_DATE, PAST_SETS)
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await navigateToExercise(page, exerciseId)
  })

  test('"Pump it!" enters edit mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Pump it!' }).click()
    await expect(page.locator('.set-row').first()).toBeVisible()
  })

  test('set rows are pre-filled with last session values', async ({ page }) => {
    await page.getByRole('button', { name: 'Pump it!' }).click()

    const firstRow = page.locator('.set-row').nth(0)
    const weightInput = firstRow.locator('input').nth(0)
    const repsInput = firstRow.locator('input').nth(1)

    // Values from PAST_SETS[0]: weight=80, reps=8
    await expect(weightInput).toHaveValue(/80/)
    await expect(repsInput).toHaveValue(/8/)
  })

  test('pre-filled data persists after save and reload', async ({ page }) => {
    // Serial: this test runs after the others; today's session may already exist.
    // Navigate fresh so we start in whatever state Firestore has.

    // If there's already a today-session (from prior test), we skip starting.
    const hasPumpIt = await page.getByRole('button', { name: 'Pump it!' }).isVisible()
    if (hasPumpIt) {
      await page.getByRole('button', { name: 'Pump it!' }).click()
    }

    const firstRow = page.locator('.set-row').nth(0)
    const weightInput = firstRow.locator('input').nth(0)

    // Make an edit to trigger auto-save (fill the weight input with same value)
    await weightInput.fill('85')
    await weightInput.blur()

    // Wait for auto-save (2-second debounce + write)
    await expect(page.getByText('Saved')).toBeVisible({ timeout: 10_000 })

    await page.reload()
    await page.waitForURL(`/exercises/${exerciseId}`)

    const reloadedWeightInput = page.locator('.set-row').nth(0).locator('input').nth(0)
    await expect(reloadedWeightInput).toHaveValue(/85/)
  })
})
```

- [ ] **Step 2: Run the spec**

```bash
npx playwright test e2e/session/start-session.spec.ts --project=chromium
```

Expected: 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/session/start-session.spec.ts
git commit -m "feat(e2e): add start-session tests (edit mode entry + pre-fill)"
```

---

### Task 7: `edit-sets.spec.ts`

**Files:**
- Create: `e2e/session/edit-sets.spec.ts`

Tests adding a set row, editing weight with the save chip confirming persistence, and verifying data survives a reload.

- [ ] **Step 1: Create the spec file**

```ts
import { test, expect } from '@playwright/test'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'
import { clearSessions, navigateToExercise } from '../fixtures/sessions'

// Selectors:
//   Add set FAB:   [data-testid="add-set-fab"]
//   Set rows:      .set-row
//   Weight input:  first input inside a .set-row
//   Saved chip:    text=Saved

test.describe.configure({ mode: 'serial' })

let exerciseId: string

test.describe('Edit sets', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
      exerciseId = await seedExercise(page, 'Deadlift', 1)
      await clearSessions(page, exerciseId)
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await navigateToExercise(page, exerciseId)
    // Start a session (no prior session seeded)
    await page.getByRole('button', { name: 'Pump it!' }).click()
    await expect(page.locator('.set-row').first()).toBeVisible()
  })

  test('add-set FAB adds a new row', async ({ page }) => {
    const initialCount = await page.locator('.set-row').count()
    await page.locator('[data-testid="add-set-fab"]').click()
    await expect(page.locator('.set-row')).toHaveCount(initialCount + 1)
  })

  test('editing weight triggers save and shows "Saved" chip', async ({ page }) => {
    const weightInput = page.locator('.set-row').nth(0).locator('input').nth(0)
    await weightInput.fill('100')
    await weightInput.blur()

    // Auto-save has a 2-second debounce; wait up to 10s for the chip
    await expect(page.getByText('Saved')).toBeVisible({ timeout: 10_000 })
  })

  test('edited weight persists after reload', async ({ page }) => {
    const weightInput = page.locator('.set-row').nth(0).locator('input').nth(0)
    await weightInput.fill('100')
    await weightInput.blur()
    await expect(page.getByText('Saved')).toBeVisible({ timeout: 10_000 })

    await page.reload()
    await page.waitForURL(`/exercises/${exerciseId}`)

    await expect(page.locator('.set-row').nth(0).locator('input').nth(0)).toHaveValue(/100/)
  })
})
```

- [ ] **Step 2: Run the spec**

```bash
npx playwright test e2e/session/edit-sets.spec.ts --project=chromium
```

Expected: 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/session/edit-sets.spec.ts
git commit -m "feat(e2e): add edit-sets tests (add row, save chip, persistence)"
```

---

### Task 8: `bump-it.spec.ts`

**Files:**
- Create: `e2e/session/bump-it.spec.ts`

Tests the BumpIt toggle: opacity changes on click, and the toggled state persists after a save and reload.

The BumpIt button uses `:style="{ opacity: bumpIt ? 1 : 0.25 }"`. Check `toHaveCSS('opacity', '1')` for active and `'0.25'` for inactive.

- [ ] **Step 1: Create the spec file**

```ts
import { test, expect } from '@playwright/test'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'
import { clearSessions, navigateToExercise } from '../fixtures/sessions'

// Selectors:
//   BumpIt button:   button containing '🆙' inside .set-row
//   Weight input:    first input in .set-row (needed to trigger save alongside bumpIt toggle)
//   Saved chip:      text=Saved

test.describe.configure({ mode: 'serial' })

let exerciseId: string

test.describe('BumpIt toggle', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
      exerciseId = await seedExercise(page, 'Overhead Press', 1)
      await clearSessions(page, exerciseId)
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await navigateToExercise(page, exerciseId)
    await page.getByRole('button', { name: 'Pump it!' }).click()
    await expect(page.locator('.set-row').first()).toBeVisible()
  })

  test('BumpIt button starts inactive (opacity 0.25)', async ({ page }) => {
    const bumpItBtn = page.locator('.set-row').nth(0).getByRole('button', { name: '🆙' })
    await expect(bumpItBtn).toHaveCSS('opacity', '0.25')
  })

  test('clicking BumpIt activates it (opacity 1)', async ({ page }) => {
    const bumpItBtn = page.locator('.set-row').nth(0).getByRole('button', { name: '🆙' })
    await bumpItBtn.click()
    await expect(bumpItBtn).toHaveCSS('opacity', '1')
  })

  test('BumpIt state persists after save and reload', async ({ page }) => {
    // Set a weight to make the session saveable, then toggle BumpIt
    const weightInput = page.locator('.set-row').nth(0).locator('input').nth(0)
    await weightInput.fill('60')
    await weightInput.blur()

    const bumpItBtn = page.locator('.set-row').nth(0).getByRole('button', { name: '🆙' })
    await bumpItBtn.click()

    await expect(page.getByText('Saved')).toBeVisible({ timeout: 10_000 })

    await page.reload()
    await page.waitForURL(`/exercises/${exerciseId}`)

    await expect(
      page.locator('.set-row').nth(0).getByRole('button', { name: '🆙' }),
    ).toHaveCSS('opacity', '1')
  })
})
```

- [ ] **Step 2: Run the spec**

```bash
npx playwright test e2e/session/bump-it.spec.ts --project=chromium
```

Expected: 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/session/bump-it.spec.ts
git commit -m "feat(e2e): add BumpIt toggle tests"
```

---

### Task 9: `delete-session.spec.ts`

**Files:**
- Create: `e2e/session/delete-session.spec.ts`

Tests the delete session flow: FAB visible when a session exists, confirmation dialog appears, confirming delete returns to read-only mode.

- [ ] **Step 1: Create the spec file**

```ts
import { test, expect } from '@playwright/test'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'
import { seedSession, clearSessions, navigateToExercise } from '../fixtures/sessions'

// Selectors:
//   Delete FAB:         [data-testid="delete-session-fab"]
//   Dialog title:       text="Delete today's session?"
//   Dialog Delete btn:  role=button[name="Delete"]
//   Pump it button:     role=button[name="Pump it!"]
//   Set rows:           .set-row

test.describe.configure({ mode: 'serial' })

let exerciseId: string

// Today's date in YYYY-MM-DD (UTC)
const TODAY = new Date().toISOString().split('T')[0]

test.describe('Delete session', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
      exerciseId = await seedExercise(page, 'Barbell Row', 1)
      await clearSessions(page, exerciseId)
      // Seed a session for today so the delete FAB is visible on load
      await seedSession(page, exerciseId, TODAY, [{ weight: 70, reps: 6 }])
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await navigateToExercise(page, exerciseId)
  })

  test('delete FAB is visible when a session exists', async ({ page }) => {
    await expect(page.locator('[data-testid="delete-session-fab"]')).toBeVisible()
  })

  test('clicking delete FAB shows confirmation dialog', async ({ page }) => {
    await page.locator('[data-testid="delete-session-fab"]').click()
    await expect(page.getByText("Delete today's session?")).toBeVisible()
  })

  test('confirming delete returns to read-only mode', async ({ page }) => {
    await page.locator('[data-testid="delete-session-fab"]').click()
    await page.getByRole('button', { name: 'Delete' }).click()

    // Edit mode gone, read-only mode restored
    await expect(page.locator('.set-row')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Pump it!' })).toBeVisible()
  })
})
```

- [ ] **Step 2: Run the spec**

```bash
npx playwright test e2e/session/delete-session.spec.ts --project=chromium
```

Expected: 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/session/delete-session.spec.ts
git commit -m "feat(e2e): add delete session tests"
```

---

### Task 10: Run full session test suite

- [ ] **Step 1: Run all session tests together**

```bash
npx playwright test e2e/session/ --project=chromium
```

Expected: 15 tests pass (3 per file × 5 files).

- [ ] **Step 2: Run the full E2E suite to check for regressions**

```bash
npm run test:e2e
```

Expected: all tests pass (existing exercise tests + new session tests).

- [ ] **Step 3: Commit if any fixes were made during integration**

If you needed to adjust any selectors or timing during the above runs, commit those fixes:

```bash
git add -p
git commit -m "fix(e2e): adjust session test selectors after integration run"
```
