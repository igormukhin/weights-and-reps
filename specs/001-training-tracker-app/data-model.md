# Data Model: Weights and Reps — Training Tracker App

**Branch**: `001-training-tracker-app` | **Date**: 2026-03-20

---

## Entities

### User

Represents an authenticated account. Owned by Firebase Auth; not stored as a
Firestore document (identity comes entirely from the Auth UID).

| Attribute | Type | Notes |
|-----------|------|-------|
| uid | string | Firebase Auth UID; used as Firestore path segment |
| displayName | string | From Google profile; display-only |
| email | string | From Google profile; display-only |

**Constraints**:
- A user can only access documents under `/users/{their own uid}/`.
- No user document is written to Firestore; the UID is the namespace key only.

---

### Exercise

Represents a named movement belonging to a user.

**Firestore path**: `/users/{uid}/exercises/{exerciseId}`

| Attribute | Type | Constraints |
|-----------|------|-------------|
| id | string | Auto-generated Firestore document ID |
| name | string | Required; unique per user (case-insensitive comparison at write time) |
| position | number | Integer ≥ 1; determines display order; re-indexed on reorder/insert |
| hidden | boolean | Default `false`; set to `true` on hide; never deleted |
| createdAt | Timestamp | Server timestamp set on creation; immutable after creation |

**Uniqueness rule**: Before creating or renaming, the client queries all non-hidden
exercises for the user and performs a case-insensitive name comparison. If a match
is found on a *different* document, the operation is rejected. A capitalisation-only
change to the exercise's own name is permitted.

**Ordering rule**: `position` is an integer. On reorder or insert, all exercise
positions are re-indexed as consecutive integers starting at 1 across the full visible
(non-hidden) list. Batch write used to keep positions consistent.

**Prefix-match insertion**: On add, the new exercise is inserted after the existing
exercise with the longest case-insensitive name that is a prefix of the new name.
If no prefix match, appended at the end (highest `position + 1`).

**State transitions**:
```
Created (hidden: false) → Hidden (hidden: true)
                           ↑ one-way; no in-app restore
```

---

### Session

Represents a single training day's log for one exercise.

**Firestore path**: `/users/{uid}/exercises/{exerciseId}/sessions/{dateStr}`

The document ID is the date string in `YYYY-MM-DD` format, which enforces one
session per exercise per calendar day and makes point lookups O(1).

| Attribute | Type | Constraints |
|-----------|------|-------------|
| date | string | `YYYY-MM-DD`; matches document ID; immutable after creation |
| sets | Set[] | Ordered array; minimum 0 entries; maximum unconstrained (practical limit ~20) |
| updatedAt | Timestamp | Client timestamp updated on every auto-save write |

**Loading behaviour**:
- "Today's session": `getDoc('/users/{uid}/exercises/{id}/sessions/{today}')` — single point lookup.
- "Last session": `getDocs` on the sessions subcollection, `orderBy('date', 'desc')`, `limit(2)`. If today's session exists, the second result is "last"; otherwise the first result is "last".

---

### Set

An embedded value object within a Session's `sets` array. Not a top-level Firestore
document.

| Attribute | Type | Constraints |
|-----------|------|-------------|
| weight | number | Decimal; minimum 0.5; step 2.5 (UI); stored with full precision |
| reps | number | Integer; minimum 1; step 1 |

**Position**: Implied by array index (0 = set 1, 1 = set 2, …). Order is stable.

**Validation rules**:
- `weight >= 0.5` (enforced client-side before save)
- `reps >= 1` (enforced client-side before save)
- Sets with `weight === null` or `reps === null` (empty rows) are excluded from the
  saved array; empty rows do not create storage records.

---

## Firestore Security Rules (structure)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // All user data is scoped to the authenticated user's UID
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

  }
}
```

**Notes**:
- No cross-user reads are possible under this ruleset.
- Unauthenticated requests are rejected at the rules layer, not just client-side.
- Field-level validation (e.g., `weight >= 0.5`) is enforced client-side; a stricter
  rules extension can be added later without breaking existing data.

---

## Entity Relationship Summary

```
User (Firebase Auth UID)
└── Exercise (1..n per user)
    ├── attributes: name, position, hidden, createdAt
    └── Session (0..n per exercise; one per calendar date)
        ├── attributes: date, updatedAt
        └── sets: [{ weight, reps }, …]  (ordered array)
```

---

## Key Invariants

1. An exercise's `name` is unique within a user's non-hidden exercises
   (case-insensitive).
2. A session document ID equals its `date` field — one session per exercise per day.
3. `position` values across a user's non-hidden exercises are consecutive integers
   starting at 1 after any reorder or insert operation.
4. A hidden exercise (`hidden: true`) is never returned in list queries; its sessions
   subcollection is preserved untouched.
5. Empty set rows (no weight or reps entered) are never persisted.
