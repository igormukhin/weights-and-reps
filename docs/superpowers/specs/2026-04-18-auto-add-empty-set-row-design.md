# Auto-Add Empty Set Row — Design

**Date:** 2026-04-18
**Status:** Approved
**Feature branch:** `006-auto-add-empty-set-row`

## Problem

On the session edit screen (`ExerciseDetailView.vue`, edit mode), a new empty set row requires tapping the `+` floating-action button. This interrupts data entry: the user finishes the last row, then has to reach for the FAB to log the next set.

## Goal

Empty rows appear automatically as the user fills the current last row. The `+` FAB is no longer needed and is removed.

## Behavior Rules

A row is **empty** iff `weight === undefined && reps === undefined`. (`bumpIt` is ignored — it cannot exist on an otherwise-empty row meaningfully, and toggling it does not affect emptiness.)

After every mutation to `todaySets`, the following invariants hold:

1. **Minimum 3 rows.** The edit view always shows at least 3 rows, matching the current default for a fresh session.
2. **At most one trailing empty row** (subject to rule 1). If the last two rows are both empty and total rows > 3, trailing empties are popped down to one.
3. **Last row is empty.** If the last row contains any data, a new empty row is appended.

### Trigger points

| Site | Action |
|------|--------|
| `init()` — edit-mode branch (today session exists) | Enforce invariants after loading sets from Firestore. Replaces the existing "pad to 3" logic. |
| `startSession()` | Enforce invariants after copying `lastSets` (or seeding empties when there is no last session). Replaces the existing "3 empty rows" seeding. |
| `updateSet(index, field, value)` | Enforce invariants after mutating a row. |
| `toggleBumpIt(index)` | No-op for invariants — `bumpIt` never changes a row's emptiness. |
| `deleteSession()` | No-op — `todaySets` is cleared to `[]` and `hasTodaySession` is false, so the edit UI is not rendered. |

### Examples

- Fresh session, no last session → `[{}, {}, {}]` (min-3 floor, all empty).
- Fresh session, last session had 3 filled sets → `[{…}, {…}, {…}, {}]` (copied + trailing empty).
- Fresh session, last session had 5 filled sets → `[{…}, {…}, {…}, {…}, {…}, {}]`.
- Loaded today session with 2 filled sets → `[{…}, {…}, {}]` (padded to 3, last row becomes the trailing empty).
- User types weight in row 3 of `[{…}, {…}, {}]` → `[{…}, {…}, {w:X}, {}]`.
- User then clears row 3 weight → `[{…}, {…}, {}, {}]` → trim → `[{…}, {…}, {}]`.
- User clears row 2 and row 3 on a 4-row list `[{…}, {}, {}, {}]` → trim down to min 3 → `[{…}, {}, {}]`.

## Architecture

### `src/composables/useSession.ts`

- Add private helper `isEmpty(set: Partial<Set>): boolean` returning `set.weight === undefined && set.reps === undefined`.
- Add private helper `enforceRowInvariants(): void` that mutates `todaySets.value` in place:
  1. While `todaySets.value.length > 3` and the last two rows are both empty, `pop()`.
  2. If `todaySets.value.length === 0` or the last row is not empty, `push({})`.
  3. While `todaySets.value.length < 3`, `push({})`.
- Call `enforceRowInvariants()` at the end of `init()` (edit-mode branch), `startSession()`, and `updateSet()`, before `syncToCache()`.
- Remove the inline "pad to 3" expression in `init()` and the "3 empty rows" expression in `startSession()` — both become the helper's responsibility.
- Remove `addSet` from the function's return object (no longer called by any consumer).

Persistence is unchanged: `persist()` already filters sets with `s.weight !== undefined`, so the trailing empty row never reaches Firestore.

### `src/views/ExerciseDetailView.vue`

- Remove the `+` FAB block (currently lines 98–109, the `<v-btn ... data-testid="add-set-fab" ... @click="addSet" />`).
- Remove `mdiPlus` from the `@mdi/js` import.
- Remove `addSet` from the destructured `useSession()` return.

### `e2e/session/edit-sets.spec.ts`

- Remove the test `'add-set FAB adds a new row'`.
- Add a replacement test `'typing in last row auto-appends an empty row'`:
  - Starts in edit mode with 3 rows (same `beforeEach` as existing tests).
  - Fills the weight input in row 3 (`.set-row` index 2).
  - Asserts `.set-row` count becomes 4.
- Update the selectors comment block at the top of the file: remove the `Add set FAB` line.

No changes needed in `SetRow.vue` — it already emits `update:newWeight` / `update:newReps` on both typed input and stepper buttons, and the composable's `updateSet` is what drives the invariants.

## Non-Goals

- **Row deletion UI.** Not part of this change. Trim-on-clear covers the main cleanup case.
- **Bump-it on empty rows.** Out of scope. A user toggling bump-it on the trailing empty row is harmless — `persist()` filters it out.
- **Changing save debounce behavior.** Auto-append itself does not call `scheduleSave()` (appending an empty row introduces no data worth saving). The existing `scheduleSave()` call in `updateSet()` still fires for the actual data change.

## Testing

### E2E (`e2e/session/edit-sets.spec.ts`)

- **Replaced:** "add-set FAB adds a new row" → "typing in last row auto-appends an empty row".
- **Unchanged:** Edit-weight-and-save and reload-persistence tests.

### Manual smoke

Run dev server (`npm run dev`) and verify:

- Fresh session (no prior session): 3 empty rows, no FAB visible.
- Fill weight in row 3 → row 4 appears automatically.
- Clear row 3 weight → row 4 disappears (back to 3 rows, one trailing empty).
- Session with 3 filled sets loaded on reload → 4 rows shown (3 filled + 1 empty).
- Session with 5 filled sets loaded on reload → 6 rows shown (5 filled + 1 empty).
- Delete session via red FAB → returns to read-only view; no stray empty rows after re-entering edit mode via "Pump it!".

### Lint / type-check

`npm run lint` must pass after the changes (unused `mdiPlus` import and unused `addSet` would otherwise break strict mode / ESLint).

## Risks

- **E2E test file references `addSet` FAB in comment blocks of `docs/superpowers/plans/2026-04-10-session-e2e-tests.md`.** Plan documents are historical; not updated as part of this change.
- **Cached session state (`useSessionStore`) on a device that predates this change.** The cached `todaySets` array could be missing the trailing empty row on first load after deploy. `syncToCache` + `enforceRowInvariants` on next mutation fix it; on pure cache-hit read in `init()` there is no enforcement. Acceptable: user simply sees current saved state; typing anywhere still triggers invariants via `updateSet`. If this proves annoying, a follow-up is to enforce invariants on the cache-hit branch too.
