# Implementation Plan: Exercise Detail Page Redesign

**Branch**: `002-exercise-detail-redesign` | **Date**: 2026-03-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-exercise-detail-redesign/spec.md`

## Summary

Redesign the Exercise Detail page to have two distinct modes: a **read-only mode** (default, shown when no today's session exists) that displays the most recent past session with a "Pump it!" button, and an **edit mode** (auto-entered when today's session exists, or triggered by "Pump it!") that allows the user to add/edit/remove sets with auto-save. A "Delete" button in edit mode allows the user to permanently remove today's session with confirmation, returning to read-only. Pre-filling today's session with last session's sets is the default behavior on "Pump it!".

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Vue 3 (Composition API), Vuetify 3, Pinia, Firebase SDK v10+
**Storage**: Firestore — `users/{uid}/exercises/{exerciseId}/sessions/{YYYY-MM-DD}`
**Testing**: Manual validation on mobile viewport (≤375px); no automated test framework in place
**Target Platform**: Web (mobile-first, used on phone in gym)
**Project Type**: Single-page web application (Vue 3 + Vite + Firebase Hosting)
**Performance Goals**: Edit mode responsive to input within 100ms; auto-save fires within 2s of last change
**Constraints**: Touch targets ≥44×44px; primary workflow ≤3 taps from exercises screen; offline errors surfaced gracefully
**Scale/Scope**: Single-user focus; one session per exercise per day; unlimited sets per session

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*
*Constitution Version: 1.0.0*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity First | ✅ Pass | "Pump it!" is 1 tap; pre-fill eliminates manual re-entry; no speculative features added |
| II. Mobile-First | ✅ Pass | Delete confirmation is a Vuetify dialog; all touch targets preserved; workflow stays ≤3 taps |
| III. Data Integrity & Auto-Save | ✅ Pass with exception (see below) | Auto-save 2s debounce unchanged; delete requires explicit confirmation |
| IV. Per-User Data Isolation | ✅ Pass | No Firestore rule changes needed; path structure unchanged |
| V. Consistent, Predictable UX | ✅ Pass | German dates, kg unit, deterministic page state preserved |

**Constitution III Exception — Hard Delete of Today's Session**:
The constitution states data MUST be soft-deleted and historical records MUST be preserved. The spec explicitly requires today's session to be "permanently deleted" via the Delete button.

*Justification*: The spirit of the soft-delete rule targets historical training data (past sessions that inform progress). Today's in-progress session is not yet "historical" — it's a recording in flight. A user who accidentally starts a session or decides not to train must be able to remove it cleanly. Soft-deleting it (marking `hidden: true`) would leave orphaned data that complicates the "does today's session exist?" check. The simpler alternative (hard `deleteDoc`) directly satisfies the spec without data model complexity. The user confirms the action explicitly.

*Simpler alternative considered*: Add `hidden: boolean` flag to Session type and filter it out in queries. Rejected because it requires changing the Session type, updating two query functions (`getTodaySession`, `getLastSession`), and adds ongoing complexity for a single "oops, wrong day" use case.

## Project Structure

### Documentation (this feature)

```text
specs/002-exercise-detail-redesign/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── useSession-api.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (affected files)

```text
src/
├── components/session/
│   ├── SetRow.vue              # Unchanged
│   ├── AddSetButton.vue        # Unchanged
│   └── DeleteSessionDialog.vue # NEW — confirmation dialog for session deletion
├── composables/
│   └── useSession.ts           # MODIFIED — add hasTodaySession, startSession, deleteSession, remove default pre-fill
├── services/
│   └── sessions.ts             # MODIFIED — add deleteSession() using deleteDoc
└── views/
    └── ExerciseDetailView.vue  # MODIFIED — two-mode UI: read-only vs edit
```

**Structure Decision**: Single-project SPA layout. No new directories needed. One new component (`DeleteSessionDialog.vue`) added to the existing `components/session/` directory.

## Phase 0: Research

See [research.md](./research.md).

## Phase 1: Design & Contracts

See [data-model.md](./data-model.md) and [contracts/useSession-api.md](./contracts/useSession-api.md).
