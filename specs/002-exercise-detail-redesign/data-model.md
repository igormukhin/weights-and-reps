# Data Model: Exercise Detail Page Redesign

**Branch**: `002-exercise-detail-redesign` | **Date**: 2026-03-21

## Firestore Schema (unchanged)

No schema changes required. The existing Firestore structure is sufficient.

```
users/
  {uid}/                          # Google Auth UID
    exercises/
      {exerciseId}/               # Auto-generated Firestore ID
        name: string              # Exercise name, unique per user (case-insensitive)
        position: number          # 1-based display order
        hidden: boolean           # Soft-delete flag for exercises
        createdAt: Timestamp
        sessions/
          {YYYY-MM-DD}/           # Document ID = ISO date string
            date: string          # YYYY-MM-DD (matches doc ID)
            sets: Set[]           # Array of { weight: number, reps: number }
            updatedAt: Timestamp  # Set by server on every save
```

## TypeScript Types (unchanged)

No type changes required. All existing types remain valid.

```typescript
// src/types/index.ts (no changes)

interface Set {
  weight: number    // kg, min 0.5, step 2.5
  reps: number      // min 1, step 1
}

interface Session {
  date: string              // YYYY-MM-DD, matches Firestore doc ID
  sets: Set[]               // empty rows are never persisted
  updatedAt: Timestamp
}
```

## New Service Function

One new function added to `src/services/sessions.ts`:

```typescript
// DELETE today's session document from Firestore
export async function deleteSession(
  uid: string,
  exerciseId: string,
  dateStr: string,          // YYYY-MM-DD
): Promise<void>
// Implementation: deleteDoc(doc(db, 'users', uid, 'exercises', exerciseId, 'sessions', dateStr))
```

## useSession Composable State Changes

| State | Type | Before | After |
|-------|------|--------|-------|
| `hasTodaySession` | `Ref<boolean>` | — (did not exist) | Added; true if today session exists in Firestore |
| `todaySets` | `Ref<Partial<Set>[]>` | Pre-filled with `{}` rows on init | Only populated from today's actual data or after `startSession()` |

### New Functions Added to useSession

```typescript
// Create today's session pre-filled with last session's sets; triggers immediate save
async function startSession(): Promise<void>

// Delete today's session from Firestore; resets state to read-only
async function deleteSession(): Promise<void>
```

### Modified Functions

**`init()`**: Changed behavior for the case where no today session exists. Previously pre-filled `todaySets` with `{}` rows. After change: leaves `todaySets` as `[]` and sets `hasTodaySession = false`. Pre-fill only happens in `startSession()`.

## Firestore Security Rules

No changes required. Existing rules already enforce per-user isolation via `users/{uid}/{document=**}` pattern. The new `deleteDoc` call is covered by the existing write permission.
