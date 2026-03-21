# Contract: useSession Composable API

**Branch**: `002-exercise-detail-redesign` | **Date**: 2026-03-21

## Overview

`useSession(uid, exerciseId)` is the primary composable for managing the exercise detail page state. It encapsulates all Firestore interactions for a single exercise's session data.

## Signature

```typescript
function useSession(uid: string, exerciseId: string): SessionComposable
```

## Return Type

```typescript
interface SessionComposable {
  // --- State (reactive refs) ---
  hasTodaySession: Ref<boolean>        // true if a session for today exists in Firestore
  todaySets: Ref<Partial<Set>[]>       // current editable sets (only populated in edit mode)
  lastSets: Ref<Set[]>                 // sets from the most recent past session (read-only reference)
  lastSessionDate: Ref<string>         // formatted as DD.MM.YYYY, empty string if no past session
  saveStatus: Ref<SaveStatus>          // 'idle' | 'saving' | 'saved' | 'error'
  saveError: Ref<string | null>        // error message, null if no error

  // --- Actions ---
  init(): Promise<void>                // Load today's and last session on mount; sets hasTodaySession
  startSession(): Promise<void>        // Create today's session pre-filled from lastSets; sets hasTodaySession = true
  updateSet(index: number, field: 'weight' | 'reps', value: number | null): void  // Update set field + schedule auto-save
  addSet(): void                       // Append empty set row to todaySets
  deleteSession(): Promise<void>       // Hard-delete today's Firestore session; reset to read-only state
}
```

## Behavioral Contract

### `init()`
- Loads both today's session and last session in parallel from Firestore.
- Sets `lastSets` and `lastSessionDate` from last session data.
- If today's session exists: sets `hasTodaySession = true`, populates `todaySets` from its sets.
- If today's session does NOT exist: sets `hasTodaySession = false`, leaves `todaySets = []`.
- Must be called once on component mount.

### `startSession()`
- Only valid to call when `hasTodaySession === false`.
- Copies `lastSets` values into `todaySets` (each set's weight and reps). If `lastSets` is empty, `todaySets` remains `[]`.
- Immediately persists the session to Firestore (non-debounced) so the session exists even if the user navigates away without editing.
- Sets `hasTodaySession = true`.

### `updateSet(index, field, value)`
- Mutates `todaySets[index][field]` in place.
- Schedules auto-save with 2-second debounce.
- `value = null` removes the field from the set object.

### `addSet()`
- Appends `{}` (empty Partial<Set>) to `todaySets`.
- The existing `watch` on `todaySets.length` schedules a save if any set has data.

### `deleteSession()`
- Calls `deleteDoc` on today's Firestore session document.
- Resets: `hasTodaySession = false`, `todaySets = []`.
- Does NOT clear `lastSets` or `lastSessionDate` (read-only view remains intact after delete).
- On Firestore error: sets `saveStatus = 'error'`, `saveError = 'Failed to delete. Check your connection.'`

## Mode Mapping

| Condition | View Mode |
|-----------|-----------|
| `hasTodaySession === false` | Read-only: show lastSets static table + "Pump it!" button |
| `hasTodaySession === true` | Edit mode: show todaySets editable table + "Delete" button |

## Invariants

- `hasTodaySession` is always derived from actual Firestore state — never set to `true` optimistically without a successful write.
- `todaySets` is only non-empty when `hasTodaySession === true`.
- Auto-save (debounced) applies only to `updateSet` and `addSet` mutations. `startSession` uses immediate persist. `deleteSession` does not trigger auto-save.
