# Research: Weights and Reps — Training Tracker App

**Branch**: `001-training-tracker-app` | **Date**: 2026-03-20

All technology decisions were pre-resolved by the project constitution (v1.0.0) and
the README. This document records the design decisions reached during planning.

---

## Decision 1: Firestore Data Model Shape

**Decision**: Subcollections — sessions nested under exercises.

```
/users/{uid}/exercises/{exerciseId}
/users/{uid}/exercises/{exerciseId}/sessions/{dateStr}
```

Sets are stored as an ordered array inside the session document (not a subcollection).

**Rationale**: Sessions are always queried in the context of a specific exercise
("give me the last 2 sessions for exercise X"). Subcollections make this query cheap
and naturally scope security rules to the owning exercise. Sets are fetched together
with their session document on every read — an array field avoids an extra round-trip
and simplifies writes (the whole set array is replaced on each auto-save).

**Alternatives considered**:
- Flat `sessions` collection with `exerciseId` field: requires a composite index and
  makes security rules more complex (must validate that `exerciseId` belongs to the
  requesting user). Rejected.
- Sets as a subcollection under session: adds a third nesting level; requires batched
  writes for a single save operation. Rejected — no benefit at this data scale.

---

## Decision 2: Exercise Ordering Strategy

**Decision**: Store an integer `position` field on each exercise document. On drag-
to-reorder or smart insert, re-index all visible exercise positions as consecutive
integers (1, 2, 3 …) and write them in a Firestore batch.

**Rationale**: Fractional/lexicographic ordering strategies (e.g., "1.5" between 1
and 2) avoid full re-indexing but accumulate precision issues over many reorders.
For a personal app with ~50 exercises, a full batch re-index on every reorder is
imperceptible and keeps position values clean.

**Alternatives considered**:
- Lexicographic ordering (Jira-style): robust at scale but adds complexity for no
  benefit at <50 items. Rejected.
- Client-side-only ordering (no persistence): loses order on refresh. Rejected.

---

## Decision 3: Smart Prefix-Match Insertion

**Decision**: When adding a new exercise with name `N`, find the existing exercise `E`
(non-hidden, by current position order) where `N.toLowerCase().startsWith(E.name.toLowerCase())`
is true and `E.name.length` is maximised. Insert the new exercise immediately after
`E`. If no match found (or list is empty), append at the end.

**Rationale**: Groups related exercises (e.g., "Bench Press", "Bench Press Incline",
"Bench Press Wide Grip") together without requiring manual drag after each addition.
Simple string prefix is sufficient — no fuzzy matching needed.

**Edge case**: If two exercises share the same longest prefix match length (unlikely
with natural exercise names), use the one with the lower current position (i.e., the
first one encountered in order).

---

## Decision 4: Drag-to-Reorder Library

**Decision**: `vuedraggable@next` (the Vue 3 wrapper around SortableJS).

**Rationale**: The de-facto standard for drag-to-reorder in Vue 3. Vuetify 3 does not
ship built-in drag-and-drop list support. SortableJS handles touch events correctly
on mobile, which is the primary target platform.

**Alternatives considered**:
- Native HTML5 drag-and-drop API: no touch support without polyfills. Rejected.
- `@dnd-kit/core` (React-oriented): not designed for Vue. Rejected.
- Vuetify v-data-table with row drag: not applicable to a simple list. Rejected.

---

## Decision 5: Debounced Auto-Save Implementation

**Decision**: Implement as a composable (`useSession.ts`) using a manual
`setTimeout` / `clearTimeout` pattern (2000ms debounce). No external debounce library
required.

**Rationale**: The requirement is a single, well-defined 2-second debounce on any
field change. A manual timer is transparent, dependency-free, and easy to test. The
composable exposes `saveStatus: Ref<'idle' | 'saving' | 'saved' | 'error'>` so the
UI can show appropriate feedback.

**Save lifecycle**:
1. User edits a field → `saveStatus = 'idle'`, timer reset to 2000ms.
2. Timer fires → `saveStatus = 'saving'`, Firestore `setDoc` call issued.
3. Promise resolves → `saveStatus = 'saved'`.
4. Promise rejects → `saveStatus = 'error'`, error message surfaced to user.

**Alternatives considered**:
- VueUse `watchDebounced`: adds a dependency for one function that is trivially
  implementable. Rejected.
- Firestore `enablePersistence()` with offline queue: increases SDK complexity; the
  spec explicitly says save failures MUST be surfaced (not silently queued). Rejected.

---

## Decision 6: State Management

**Decision**: Pinia for global state. Two stores: `authStore` (current user) and
`exercisesStore` (exercise list + positions).

Session data (today's sets, last session's sets, save status) is local to the
`ExerciseDetailView` via the `useSession` composable — not stored globally, as the
user can only view one exercise at a time.

**Rationale**: Pinia is the official Vue 3 state management library. Exercise list
must be globally accessible (for reordering and the exercises screen). Auth state
must be globally accessible (for router guards and Firestore service calls).

---

## Decision 7: Routing & Auth Guard

**Decision**: Vue Router 4 with a `beforeEach` navigation guard. Unauthenticated
users are redirected to `/login`; authenticated users on `/login` are redirected to
`/exercises`.

Routes:
- `/login` — `LoginView.vue`
- `/exercises` — `ExercisesView.vue` (requires auth)
- `/exercises/:id` — `ExerciseDetailView.vue` (requires auth)

**Rationale**: Standard Vue Router guard pattern. Clean separation of auth-gated
and public routes.
