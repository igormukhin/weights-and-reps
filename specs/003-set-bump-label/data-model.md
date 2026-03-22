# Data Model: BumpIt Set Label

**Feature**: 003-set-bump-label
**Date**: 2026-03-22

## Changed Entities

### `Set` (modified — `src/types/index.ts`)

| Field   | Type      | Required | Default | Notes |
|---------|-----------|----------|---------|-------|
| weight  | `number`  | Yes      | —       | kg, min 0.5, step 2.5 |
| reps    | `number`  | No       | —       | min 1, integer |
| bumpIt  | `boolean` | No       | `false` | Absent treated as `false`. `true` = BumpIt label applied to this set. |

**Before**:
```ts
export interface Set {
  weight: number
  reps?: number
}
```

**After**:
```ts
export interface Set {
  weight: number
  reps?: number
  bumpIt?: boolean
}
```

### Storage Location

Firestore path: `users/{uid}/exercises/{exerciseId}/sessions/{YYYY-MM-DD}`

The `sets` array is an embedded array of `Set` objects. The `bumpIt` field is stored inline on each set object:

```json
{
  "date": "2026-03-22",
  "sets": [
    { "weight": 100, "reps": 5, "bumpIt": true },
    { "weight": 100, "reps": 5 },
    { "weight": 97.5, "reps": 6 }
  ],
  "updatedAt": "..."
}
```

## Persistence Rules

- `bumpIt: true` — written explicitly to Firestore.
- `bumpIt: false` or absent — may be omitted on write; read as `false` everywhere in the app.
- The `persist()` validity filter (weight-only) is unchanged. `bumpIt` is not a validity criterion and does not affect whether a set is saved or discarded.

## Carry-Over Behaviour

When `startSession()` copies sets from the last session, `bumpIt` is carried over automatically via object spread (`{ ...s }`). No code change required.

## No Schema Migration Required

Existing session documents without a `bumpIt` field are valid. All read paths treat absent `bumpIt` as `false`. Old sessions display no emoji in the BumpIt column.

## Firestore Rules

No changes required. The existing wildcard rule:
```
match /users/{uid}/{document=**} {
  allow read, write: if request.auth.uid == uid;
}
```
already covers all fields within session documents, including the new `bumpIt` field.
