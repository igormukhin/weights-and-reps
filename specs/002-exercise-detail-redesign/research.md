# Research: Exercise Detail Page Redesign

**Branch**: `002-exercise-detail-redesign` | **Date**: 2026-03-21

## Decisions

### 1. Session Delete Strategy: Hard Delete (`deleteDoc`)

**Decision**: Use Firestore `deleteDoc` to permanently remove today's session document.

**Rationale**: Today's in-progress session is not historical data — it's a recording in flight that the user may decide to discard. The existing soft-delete pattern (used for exercises via `hidden: true`) is designed to preserve long-term training history. Adding `hidden` to Session would require changing the type, updating all queries that check for today's session, and create orphaned documents. Hard delete is the correct scalpel here.

**Alternatives considered**:
- Soft-delete (`hidden: true` on Session) — rejected; adds query complexity with no user benefit since the user is explicitly discarding in-progress work with confirmation.
- No delete at all — rejected; user explicitly requested this functionality.

---

### 2. Mode Detection: Derived from `hasTodaySession` State

**Decision**: `useSession` exposes a reactive `hasTodaySession: Ref<boolean>` that drives whether the view renders in read-only or edit mode. Computed from Firestore check on `init()`.

**Rationale**: The two modes (read-only vs edit) are entirely driven by whether a today session exists. A single boolean is sufficient — no separate "mode" enum is needed. This keeps the composable minimal.

**Alternatives considered**:
- Expose an `isEditMode` ref that can be manually toggled — rejected; mode is always derived from session existence, never set independently.
- Derive mode purely in the view component — rejected; the view should not contain data fetching logic.

---

### 3. Pre-fill on "Pump it!": Copy Last Session's Sets (Weight + Reps)

**Decision**: When `startSession()` is called (user clicks "Pump it!"), `todaySets` is pre-populated with the full set data from `lastSets` (each set's weight and reps copied). If no last session exists, `todaySets` starts empty (0 rows).

**Rationale**: The spec and clarification Q1 explicitly require pre-filling with last session's weight and reps. The constitution (Principle I) mandates "smart prefilling" to reduce manual entry. This is the primary UX value of the feature.

**Note on current behavior**: The current `useSession.init()` pre-fills row *count* but not *values* (empty `{}` rows). The new behavior pre-fills both count and values, and only does so when "Pump it!" is clicked — not on init when a today session already exists.

**Alternatives considered**:
- Pre-fill only set count (current behavior) — rejected per spec clarification.
- Pre-fill all fields + let user clear them — accepted (this is the chosen approach).

---

### 4. Auto-Save Trigger for "Pump it!": Immediate Persist on Session Creation

**Decision**: When `startSession()` is called, after setting `todaySets`, trigger an immediate save (not debounced) to create the Firestore document for today. This ensures `hasTodaySession` becomes `true` and the session persists even if the user doesn't modify any values.

**Rationale**: If the user clicks "Pump it!" and immediately navigates away without editing, a session with the pre-filled data should exist. This makes the behavior consistent: clicking "Pump it!" always creates a session. The 2s debounce applies to subsequent edits.

**Alternatives considered**:
- Lazy create: only write to Firestore when the user first edits a field — rejected; if user clicks "Pump it!" and navigates away, returning shows read-only mode again (unexpected behavior per spec).

---

### 5. Delete Flow: Vue Component (`DeleteSessionDialog.vue`)

**Decision**: Extract the delete confirmation UI into a dedicated `DeleteSessionDialog.vue` component using Vuetify's `v-dialog`.

**Rationale**: Keeps `ExerciseDetailView.vue` focused on layout and mode orchestration. The dialog is a discrete concern. Mirrors the existing pattern (see `HideExerciseDialog.vue`).

**Alternatives considered**:
- Inline confirmation in the view using a `v-dialog` directly — valid but results in a bloated view template.

---

### 6. Read-Only Mode Layout: Last Session Sets as Static Table

**Decision**: In read-only mode, display the last session's sets in a simplified static table (no input fields) alongside the session date. The existing `SetRow` component is edit-mode only; the read-only table uses plain Vuetify grid rows.

**Rationale**: `SetRow` is purpose-built for editing (it has input fields, prev-value props, etc.). Reusing it in read-only mode with disabled inputs would be overcomplicated. A simple static display is cleaner and aligns with Principle I (Simplicity First). No new component needed — just `v-row` / `v-col` in the view template.

**Alternatives considered**:
- Add a `readonly` prop to `SetRow` — rejected; would require significant rework of the component for a use case that doesn't need input fields at all.
