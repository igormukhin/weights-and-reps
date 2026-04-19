# Auto-Add Empty Set Row Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On the session edit screen, an empty set row is appended automatically as the user fills the current last row; the `+` FAB is removed.

**Architecture:** Extract a pure `enforceRowInvariants` helper to `src/utils/setRowInvariants.ts` that mutates an array in place to satisfy three invariants (min 3 rows, at most one trailing empty, last row empty). Unit-test exhaustively with vitest. Call it from `useSession` after every `todaySets` mutation. Remove the FAB button from `ExerciseDetailView.vue`.

**Tech Stack:** TypeScript 5.6 (strict), Vue 3 Composition API, Vuetify 3, Pinia, vitest (unit), Playwright (E2E).

**Spec:** [`docs/superpowers/specs/2026-04-18-auto-add-empty-set-row-design.md`](../specs/2026-04-18-auto-add-empty-set-row-design.md)

**Feature branch:** `006-auto-add-empty-set-row` (already created).

---

## Task 1: Pure invariant helper with unit tests

**Files:**
- Create: `src/utils/setRowInvariants.ts`
- Test: `src/utils/setRowInvariants.test.ts`

Follow the existing unit-test pattern in `src/utils/exercisePosition.test.ts` (vitest, colocated test file, `describe`/`it`/`expect`).

The helper is a pure function over a `Partial<Set>[]` array. Mutating in place (returning `void`) matches how `useSession` currently mutates `todaySets.value` (see `addSet()` at `src/composables/useSession.ts:114-117` which does `.push({})` on the ref's `.value`).

- [ ] **Step 1: Write the failing tests**

Create `src/utils/setRowInvariants.test.ts` with the following contents:

```ts
import { describe, it, expect } from 'vitest'
import type { Set } from '@/types'
import { isEmptySet, enforceRowInvariants } from './setRowInvariants'

describe('isEmptySet', () => {
  it('is true when both weight and reps are undefined', () => {
    expect(isEmptySet({})).toBe(true)
  })

  it('is true when only bumpIt is set (bumpIt does not count)', () => {
    expect(isEmptySet({ bumpIt: true })).toBe(true)
  })

  it('is false when weight is set', () => {
    expect(isEmptySet({ weight: 100 })).toBe(false)
  })

  it('is false when reps is set', () => {
    expect(isEmptySet({ reps: 8 })).toBe(false)
  })

  it('is false when both weight and reps are set', () => {
    expect(isEmptySet({ weight: 100, reps: 8 })).toBe(false)
  })
})

describe('enforceRowInvariants', () => {
  it('pads an empty array up to 3 empty rows', () => {
    const sets: Partial<Set>[] = []
    enforceRowInvariants(sets)
    expect(sets).toEqual([{}, {}, {}])
  })

  it('pads a single-row array up to 3 rows', () => {
    const sets: Partial<Set>[] = [{ weight: 100 }]
    enforceRowInvariants(sets)
    expect(sets).toEqual([{ weight: 100 }, {}, {}])
  })

  it('keeps 3 all-empty rows unchanged', () => {
    const sets: Partial<Set>[] = [{}, {}, {}]
    enforceRowInvariants(sets)
    expect(sets).toEqual([{}, {}, {}])
  })

  it('appends an empty row when the last row has data (3 filled)', () => {
    const sets: Partial<Set>[] = [
      { weight: 100, reps: 8 },
      { weight: 100, reps: 8 },
      { weight: 100, reps: 8 },
    ]
    enforceRowInvariants(sets)
    expect(sets).toEqual([
      { weight: 100, reps: 8 },
      { weight: 100, reps: 8 },
      { weight: 100, reps: 8 },
      {},
    ])
  })

  it('appends an empty row when the last row has only weight', () => {
    const sets: Partial<Set>[] = [{}, {}, { weight: 100 }]
    enforceRowInvariants(sets)
    expect(sets).toEqual([{}, {}, { weight: 100 }, {}])
  })

  it('appends an empty row when the last row has only reps', () => {
    const sets: Partial<Set>[] = [{}, {}, { reps: 8 }]
    enforceRowInvariants(sets)
    expect(sets).toEqual([{}, {}, { reps: 8 }, {}])
  })

  it('is idempotent when last row is already empty and length > 3', () => {
    const sets: Partial<Set>[] = [
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
      {},
    ]
    enforceRowInvariants(sets)
    expect(sets).toEqual([
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
      {},
    ])
  })

  it('trims one trailing empty when there are two and length > 3', () => {
    const sets: Partial<Set>[] = [
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
      {},
      {},
    ]
    enforceRowInvariants(sets)
    expect(sets).toEqual([
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
      {},
    ])
  })

  it('trims multiple trailing empties down to one when length > 3', () => {
    const sets: Partial<Set>[] = [
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
      {},
      {},
      {},
    ]
    enforceRowInvariants(sets)
    expect(sets).toEqual([
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
      {},
    ])
  })

  it('does not trim below 3 rows even when trailing empties are present', () => {
    const sets: Partial<Set>[] = [{ weight: 100 }, {}, {}, {}]
    enforceRowInvariants(sets)
    expect(sets).toEqual([{ weight: 100 }, {}, {}])
  })

  it('does not trim below 3 rows when there are many trailing empties', () => {
    const sets: Partial<Set>[] = [{ weight: 100 }, {}, {}, {}, {}]
    enforceRowInvariants(sets)
    expect(sets).toEqual([{ weight: 100 }, {}, {}])
  })

  it('pads a 2-row filled array to 3 rows with trailing empty', () => {
    const sets: Partial<Set>[] = [{ weight: 100 }, { weight: 100 }]
    enforceRowInvariants(sets)
    expect(sets).toEqual([{ weight: 100 }, { weight: 100 }, {}])
  })

  it('handles a 5-row all-filled session by appending a trailing empty', () => {
    const sets: Partial<Set>[] = [
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
    ]
    enforceRowInvariants(sets)
    expect(sets).toEqual([
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
      {},
    ])
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npm run test -- setRowInvariants`

Expected: module resolution error or "function is not defined" — the file `setRowInvariants.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

Create `src/utils/setRowInvariants.ts`:

```ts
import type { Set } from '@/types'

/**
 * A set row is empty when neither weight nor reps has a value.
 * bumpIt alone does not count as data — a bumpIt-only row is still empty.
 */
export function isEmptySet(set: Partial<Set>): boolean {
  return set.weight === undefined && set.reps === undefined
}

/**
 * Mutates the given array in place so that after this call:
 *   1. There are at least 3 rows.
 *   2. At most one trailing empty row exists (subject to rule 1).
 *   3. The last row is empty (subject to rules 1 and 2).
 */
export function enforceRowInvariants(sets: Partial<Set>[]): void {
  // Rule 2: while there are 2+ trailing empty rows and length > 3, pop one.
  while (
    sets.length > 3 &&
    isEmptySet(sets[sets.length - 1]!) &&
    isEmptySet(sets[sets.length - 2]!)
  ) {
    sets.pop()
  }
  // Rule 3: if last row has data (or array is empty), append an empty row.
  const last = sets[sets.length - 1]
  if (last === undefined || !isEmptySet(last)) {
    sets.push({})
  }
  // Rule 1: pad up to 3.
  while (sets.length < 3) {
    sets.push({})
  }
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npm run test -- setRowInvariants`

Expected: all `isEmptySet` and `enforceRowInvariants` tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/setRowInvariants.ts src/utils/setRowInvariants.test.ts
git commit -m "feat: pure helper for set-row invariants

Extracts the rules that keep the session edit view at min 3 rows with
exactly one trailing empty row, so useSession can call a single
well-tested helper instead of carrying the rules inline.
"
```

---

## Task 2: Integrate helper into `useSession`

**Files:**
- Modify: `src/composables/useSession.ts`

`useSession` currently pads the loaded session to 3 rows in `init()` and seeds `startSession()` with 3 empty rows. Replace both with calls to `enforceRowInvariants`, and add a call inside `updateSet` so that typing into the last row auto-appends a new empty row.

`toggleBumpIt` does not need a call — bumpIt never changes a row's emptiness per the helper's definition.

The cache-hit branch in `init()` also gets a pass through the helper, so a session cached before this feature deployed still gets the trailing empty row on load. (The spec's Risks section noted this as optional follow-up; fixing it here is cheap and removes the edge case.)

We keep `addSet` in the returned API and continue to have the FAB call it in this task; the FAB is removed in Task 3. This keeps each task's changes self-contained.

- [ ] **Step 1: Add the import**

At the top of `src/composables/useSession.ts`, add to the existing imports:

```ts
import { enforceRowInvariants } from '@/utils/setRowInvariants'
```

- [ ] **Step 2: Update `init()` — edit-mode branch**

Replace the `if (todaySession) { ... }` block inside `init()` (currently lines 70-81 of `src/composables/useSession.ts`) with:

```ts
    if (todaySession) {
      hasTodaySession.value = true
      isSessionPersisted.value = true
      todaySets.value = todaySession.sets.map((s) => ({ ...s }))
      enforceRowInvariants(todaySets.value)
    } else {
      hasTodaySession.value = false
      isSessionPersisted.value = false
      todaySets.value = []
    }
```

The `else` branch leaves `todaySets.value` empty because `hasTodaySession === false` — the edit UI is not rendered yet, so no invariants are needed until the user clicks "Pump it!".

- [ ] **Step 3: Update the cache-hit branch of `init()`**

Replace the `if (cached) { ... }` block inside `init()` (currently lines 48-57) so that the cached `todaySets` passes through the helper before the function returns:

```ts
    const cached = sessionStore.get(exerciseId, today)
    if (cached) {
      hasTodaySession.value = cached.hasTodaySession
      isSessionPersisted.value = cached.isSessionPersisted
      todaySets.value = cached.todaySets.map((s) => ({ ...s }))
      lastSets.value = cached.lastSets
      lastSessionDate.value = cached.lastSessionDate
      if (hasTodaySession.value) {
        enforceRowInvariants(todaySets.value)
      }
      isLoading.value = false
      return
    }
```

The `hasTodaySession` check mirrors the cache-miss branch: we only enforce invariants when the edit UI will actually render.

- [ ] **Step 4: Update `startSession()`**

Replace the body of `startSession` (currently lines 90-97) with:

```ts
  function startSession(): void {
    todaySets.value = lastSets.value.length > 0
      ? lastSets.value.map((s) => ({ ...s }))
      : []
    enforceRowInvariants(todaySets.value)
    hasTodaySession.value = true
    isSessionPersisted.value = false
    syncToCache()
  }
```

The helper handles both cases: `[]` becomes `[{}, {}, {}]`, and a non-empty `lastSets` copy gets a trailing empty row appended.

- [ ] **Step 5: Update `updateSet()`**

Replace the body of `updateSet` (currently lines 102-112) with:

```ts
  function updateSet(index: number, field: 'weight' | 'reps', value: number | null): void {
    const set = { ...todaySets.value[index] }
    if (value === null) {
      delete set[field]
    } else {
      set[field] = value
    }
    todaySets.value[index] = set
    enforceRowInvariants(todaySets.value)
    syncToCache()
    scheduleSave()
  }
```

The helper runs before `syncToCache()` so the cache always reflects the invariant-satisfying state.

- [ ] **Step 6: Run the existing tests to confirm nothing regressed**

Run: `npm run test`

Expected: pre-existing `exercisePosition` tests and the new `setRowInvariants` tests all pass.

- [ ] **Step 7: Type-check**

Run: `npm run lint`

Expected: exit code 0. (`npm run lint` maps to `vue-tsc --noEmit` per `package.json`.)

- [ ] **Step 8: Commit**

```bash
git add src/composables/useSession.ts
git commit -m "feat: apply set-row invariants in useSession

init(), startSession(), and updateSet() now delegate row shaping to
enforceRowInvariants so a trailing empty row appears automatically as
the user fills the last row. Cache-hit path also re-enforces, so a
session cached before this change gets the trailing empty on load.
"
```

---

## Task 3: Remove the `+` FAB from the view

**Files:**
- Modify: `src/views/ExerciseDetailView.vue`

With Task 2 in place, users never need the `+` button — the last row is always empty and typing into it grows the list. Remove the button, the unused icon import, and the unused destructured `addSet`.

- [ ] **Step 1: Remove the FAB block**

In `src/views/ExerciseDetailView.vue`, delete the entire `<v-btn>` block for the add-set FAB (currently lines 98-109):

```vue
  <!-- Add set FAB — only in edit mode -->
  <v-btn
    v-if="hasTodaySession"
    data-testid="add-set-fab"
    color="primary"
    :icon="mdiPlus"
    size="large"
    position="fixed"
    location="bottom right"
    class="ma-4"
    @click="addSet"
  />
```

- [ ] **Step 2: Remove `mdiPlus` from the icon import**

Change the line (currently line 146):

```ts
import { mdiArrowLeft, mdiDelete, mdiPlus } from '@mdi/js'
```

to:

```ts
import { mdiArrowLeft, mdiDelete } from '@mdi/js'
```

- [ ] **Step 3: Remove `addSet` from the destructured `useSession()` return**

Change the `useSession` destructure (currently lines 170-186) so the `addSet,` line is deleted:

```ts
const {
  isLoading,
  hasTodaySession,
  isSessionPersisted,
  todaySets,
  lastSets,
  lastSessionDate,
  saveStatus,
  saveError,
  init,
  flushSave,
  startSession,
  updateSet,
  toggleBumpIt,
  deleteSession,
} = useSession(uid, exerciseId)
```

- [ ] **Step 4: Type-check**

Run: `npm run lint`

Expected: exit code 0. (If it fails with "unused variable" or "cannot find name mdiPlus", re-check steps 1–3.)

- [ ] **Step 5: Commit**

```bash
git add src/views/ExerciseDetailView.vue
git commit -m "feat: remove + FAB from session edit screen

The add-set FAB is obsolete now that useSession auto-appends a trailing
empty row. Removing the button also removes the only caller of addSet.
"
```

---

## Task 4: Remove the now-unused `addSet` export from `useSession`

**Files:**
- Modify: `src/composables/useSession.ts`

`addSet` has no remaining callers after Task 3. Remove the function and its entry in the returned object.

- [ ] **Step 1: Delete the `addSet` function**

In `src/composables/useSession.ts`, delete the `addSet` function (currently lines 114-117):

```ts
  function addSet(): void {
    todaySets.value.push({})
    syncToCache()
  }
```

- [ ] **Step 2: Remove `addSet` from the return object**

Change the `return { ... }` block so the `addSet,` line is deleted:

```ts
  return {
    isLoading: isLoading as Ref<boolean>,
    hasTodaySession: hasTodaySession as Ref<boolean>,
    isSessionPersisted: isSessionPersisted as Ref<boolean>,
    todaySets: todaySets as Ref<Partial<Set>[]>,
    lastSets,
    lastSessionDate,
    saveStatus,
    saveError,
    init,
    flushSave,
    startSession,
    updateSet,
    toggleBumpIt,
    deleteSession,
  }
```

- [ ] **Step 3: Type-check**

Run: `npm run lint`

Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
git add src/composables/useSession.ts
git commit -m "refactor: drop unused addSet from useSession

The + FAB was addSet's only caller and is gone.
"
```

---

## Task 5: Update the E2E test

**Files:**
- Modify: `e2e/session/edit-sets.spec.ts`

Replace the FAB-based test with one that types into the last row and asserts a new row appeared. Remove the obsolete `Add set FAB` line from the selectors comment block.

- [ ] **Step 1: Update the selectors comment block**

Change the comment block at the top of `e2e/session/edit-sets.spec.ts` (currently lines 6-10) from:

```ts
// Selectors:
//   Add set FAB:   [data-testid="add-set-fab"]
//   Set rows:      .set-row
//   Weight input:  first input inside a .set-row
//   Saved chip:    text=Saved
```

to:

```ts
// Selectors:
//   Set rows:      .set-row
//   Weight input:  first input inside a .set-row
//   Saved chip:    text=Saved
```

- [ ] **Step 2: Replace the FAB test**

Replace the test starting `test('add-set FAB adds a new row', ...)` (currently lines 37-41) with:

```ts
  test('typing weight in the last row auto-appends an empty row', async ({ page }) => {
    const initialCount = await page.locator('.set-row').count()
    const lastWeightInput = page.locator('.set-row').nth(initialCount - 1).locator('input').nth(0)
    await lastWeightInput.fill('100')
    await lastWeightInput.blur()
    await expect(page.locator('.set-row')).toHaveCount(initialCount + 1)
  })
```

The test starts with whatever min-row count the UI renders (3 after `Pump it!` with no prior session), fills the last row's weight input, then asserts the count grew by one.

- [ ] **Step 3: Run the affected E2E spec**

Run: `npm run test:e2e -- edit-sets`

Expected: all three tests in `edit-sets.spec.ts` pass.

(If Firestore emulator prerequisites are not running locally, the whole E2E suite will fail at setup — this is an environment issue, not a regression. Start the emulator per the project's E2E readme before re-running.)

- [ ] **Step 4: Commit**

```bash
git add e2e/session/edit-sets.spec.ts
git commit -m "test(e2e): cover auto-append of empty set row

The old FAB test is gone along with the FAB. The new test verifies
that typing weight into the last row grows the row count by one.
"
```

---

## Task 6: Full verification

**Files:** (no changes — verification only)

- [ ] **Step 1: Run the full unit-test suite**

Run: `npm run test`

Expected: all vitest tests pass.

- [ ] **Step 2: Type-check and build**

Run: `npm run build`

Expected: exit code 0. (`build` maps to `vue-tsc -b && vite build` per `package.json`, so this covers both type-checking the whole project and producing a production build.)

- [ ] **Step 3: Run the full E2E suite**

Run: `npm run test:e2e`

Expected: all specs pass. In particular, verify no other session spec depended on the `+` FAB — a quick search:

```bash
git grep -n "add-set-fab" -- 'e2e/**'
```

Expected: no matches.

- [ ] **Step 4: Manual smoke test in the dev server**

Run `npm run dev`, sign in, and exercise these flows:

1. Open an exercise with no prior session → click "Pump it!" → verify 3 empty rows render, no `+` FAB in the bottom-right corner.
2. Type a weight in row 3 → verify a 4th empty row appears.
3. Type a weight in row 4 → verify a 5th empty row appears.
4. Clear row 4's weight (backspace to empty) → verify row 5 disappears (back to 4 rows).
5. Clear row 3's weight → verify back to 3 rows (cannot go below min).
6. Open an exercise that has a prior session with 3 filled sets → click "Pump it!" → verify 4 rows render (3 prefilled + 1 empty trailing).
7. Reload the browser in edit mode → verify the trailing empty row persists.
8. Delete the session via the red FAB → verify the view returns to read-only, then "Pump it!" again starts fresh correctly.

If any step fails, file the symptom and stop — do not paper over with ad-hoc fixes.

- [ ] **Step 5: No commit required for this task** (verification only)

---

## Task 7: Finish the branch

Per the project's memory rules (see `MEMORY.md`):
- Feature branches merge to `main` via fast-forward only.
- Always squash feature-branch commits into one before merging.
- Do **not** deploy as part of this plan — deploy only when the user explicitly asks.

- [ ] **Step 1: Review the branch commits**

```bash
git log --oneline main..HEAD
```

Expected output (order and exact hashes will vary):

```
<hash> test(e2e): cover auto-append of empty set row
<hash> refactor: drop unused addSet from useSession
<hash> feat: remove + FAB from session edit screen
<hash> feat: apply set-row invariants in useSession
<hash> feat: pure helper for set-row invariants
<hash> docs: spec for auto-add empty set row
```

- [ ] **Step 2: Stop and hand back to the user**

The squash + fast-forward merge and any subsequent push/deploy require explicit user authorization. Report the branch is ready to merge (or ready for PR, depending on the user's preference) and wait for direction.

---

## Spec coverage summary

| Spec requirement | Task(s) |
|------------------|---------|
| Minimum 3 rows invariant | Task 1 tests, Task 2 integration |
| At-most-one-trailing-empty invariant | Task 1 tests, Task 2 integration |
| Last row empty invariant | Task 1 tests, Task 2 integration |
| bumpIt does not affect emptiness | Task 1 `isEmptySet` tests |
| `init()` edit-mode branch uses invariants | Task 2 Step 2 |
| `startSession()` uses invariants | Task 2 Step 4 |
| `updateSet()` uses invariants | Task 2 Step 5 |
| `toggleBumpIt()` is a no-op for invariants | Covered by omission (no code change) |
| Persistence unchanged — `persist()` already filters empty rows | No code change needed; Task 6 manual smoke verifies |
| Remove `+` FAB and `mdiPlus` import | Task 3 |
| Remove `addSet` export from `useSession` | Task 4 |
| Replace E2E FAB test with auto-append test | Task 5 |
| Update E2E selectors comment | Task 5 Step 1 |
| Cache-hit branch in `init()` (spec Risks follow-up) | Task 2 Step 3 — pulled in to close the edge case |
