# Exercise List E2E Tests — Design

**Date:** 2026-04-09
**Scope:** E2E tests for exercise list operations: rename, hide, reorder, and add-with-ordering

---

## Context

One E2E test suite already exists (`e2e/exercises/add-exercise.spec.ts`) covering basic add and persistence. This design extends coverage to all remaining exercise list operations.

The test stack uses Playwright + Firebase Emulator Suite. Global setup resets emulator state once before the full run and creates a test user. Individual spec files seed their own Firestore data via a shared fixture helper.

---

## Component Changes

**`src/components/exercises/ExerciseListItem.vue`**

Add `data-testid` attributes to the two icon buttons:
- `data-testid="rename-exercise-btn"` on the pencil (`mdi-pencil-outline`) button
- `data-testid="hide-exercise-btn"` on the eye-off (`mdi-eye-off-outline`) button

These are currently unreachable by stable selectors. Vuetify icon buttons don't carry accessible labels by default, so `data-testid` is the right approach (consistent with `data-testid="add-exercise-fab"` already in use).

---

## New Fixture: `e2e/fixtures/exercises.ts`

Exports `seedExercise(page, name, position)`.

**How it works:**
1. Assumes `signInAsTestUser(page)` has already been called (page is signed in, on `/exercises`)
2. Uses `page.evaluate()` with window-exposed Firebase helpers to write directly to `users/{uid}/exercises` in the Firestore emulator
3. Writes `{ name, position, hidden: false, createdAt: serverTimestamp() }`

**Why this approach:** Consistent with the existing `signInAsTestUser` pattern. No new dependencies. No emulator admin API needed — uses the authenticated Firebase SDK already running in the page.

**Required change to `src/services/firebase.ts`:** Extend the emulator block to also expose `__e2eDb`, `__e2eAddDoc`, `__e2eCollection`, and `__e2eServerTimestamp` on `window`, alongside the existing `__e2eAuth` and `__e2eSignIn`.

**`beforeAll` pattern** (used by all new spec files):

```typescript
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage()
  await signInAsTestUser(page)
  await seedExercise(page, 'Exercise Name', 1)
  await page.close()
})
```

---

## Spec Files

All new spec files use `test.describe.configure({ mode: 'serial' })`. Each `beforeEach` calls `signInAsTestUser(page)` to land on `/exercises`.

### `e2e/exercises/rename-exercise.spec.ts`

**beforeAll:** seed "Deadlift" at position 1

| # | Test | Steps | Assert |
|---|------|-------|--------|
| 1 | renamed exercise appears in list | edit mode → rename btn on "Deadlift" → fill "Romanian Deadlift" → Save | "Romanian Deadlift" visible; "Deadlift" gone |
| 2 | renamed exercise persists after reload | reload | "Romanian Deadlift" still visible |
| 3 | cancel rename leaves name unchanged | edit mode → rename btn → fill "Something Else" → Cancel | "Romanian Deadlift" still visible |

### `e2e/exercises/hide-exercise.spec.ts`

**beforeAll:** seed "Squat" at position 1 and "Pull-up" at position 2

| # | Test | Steps | Assert |
|---|------|-------|--------|
| 1 | hidden exercise disappears from list | edit mode → hide btn on "Squat" → confirm Hide | "Squat" gone; "Pull-up" still visible |
| 2 | hidden exercise stays hidden after reload | reload | "Squat" still absent |
| 3 | cancel hide leaves exercise in list | edit mode → hide btn on "Pull-up" → Cancel | "Pull-up" still visible |

### `e2e/exercises/reorder-exercises.spec.ts`

**beforeAll:** seed "Bench Press" (pos 1), "Squat" (pos 2), "Deadlift" (pos 3)

| # | Test | Steps | Assert |
|---|------|-------|--------|
| 1 | dragged exercise appears in new position | edit mode → drag "Deadlift" drag handle to top | list order: Deadlift, Bench Press, Squat |
| 2 | reordered list persists after reload | reload | same order persists |

**Drag implementation note:** Use Playwright's `dragAndDrop()` targeting the `.drag-handle` element within the "Deadlift" list item, dropping onto the "Bench Press" list item. vuedraggable uses SortableJS, which responds to native pointer events that `dragAndDrop()` emits.

### `e2e/exercises/add-exercise-ordering.spec.ts`

**beforeAll:** seed "Bench Press" (pos 1), "Squat" (pos 2)

| # | Test | Steps | Assert |
|---|------|-------|--------|
| 1 | new exercise inserts after longest-prefix match | edit mode → add FAB → fill "Bench Fly" → Add | list order: Bench Press, Bench Fly, Squat |
| 2 | new exercise with no prefix match appends to end | add "Overhead Press" | appears after Squat (last in list) |

**Note:** The unit-level insertion logic is already tested in `exercisePosition.test.ts`. These E2E tests verify that the position computed by `findInsertPosition` is correctly reflected in the rendered list — not the logic itself.

---

## Selectors Reference

| Element | Selector |
|---------|----------|
| Edit mode toggle | `getByRole('button', { name: 'Edit' })` |
| Done button | `getByRole('button', { name: 'Done' })` |
| Add exercise FAB | `[data-testid="add-exercise-fab"]` |
| Exercise name input | `getByLabel('Exercise name')` |
| Add submit button | `getByRole('button', { name: 'Add' })` |
| Exercise list items | `.exercise-name` |
| Rename button | `[data-testid="rename-exercise-btn"]` |
| Hide button | `[data-testid="hide-exercise-btn"]` |
| Save (rename dialog) | `getByRole('button', { name: 'Save' })` |
| Hide (confirm dialog) | `getByRole('button', { name: 'Hide' })` |
| Cancel (any dialog) | `getByRole('button', { name: 'Cancel' })` |
| Drag handle | `.drag-handle` |

---

## File Summary

**Modified:**
- `src/services/firebase.ts` — expose Firestore helpers on `window` in emulator mode
- `src/components/exercises/ExerciseListItem.vue` — add `data-testid` to rename/hide buttons

**New:**
- `e2e/fixtures/exercises.ts` — `seedExercise` helper
- `e2e/exercises/rename-exercise.spec.ts`
- `e2e/exercises/hide-exercise.spec.ts`
- `e2e/exercises/reorder-exercises.spec.ts`
- `e2e/exercises/add-exercise-ordering.spec.ts`
