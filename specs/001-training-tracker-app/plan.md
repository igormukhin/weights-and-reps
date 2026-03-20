# Implementation Plan: Weights and Reps — Training Tracker App

**Branch**: `001-training-tracker-app` | **Date**: 2026-03-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-training-tracker-app/spec.md`

## Summary

Build a mobile-first single-page web application for personal training tracking.
Users sign in with Google, manage a manually-ordered exercise list, and log sets
(weight in kg + reps) per exercise. A debounced auto-save persists data to Firestore
within 2 seconds of the last change. The previous session's values are shown as
read-only reference alongside new input fields.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Vue 3 (Composition API), Vuetify 3, Vue Router 4, Pinia,
Vite, Firebase JS SDK v10, vuedraggable@next (SortableJS wrapper for drag-to-reorder)
**Storage**: Firebase Firestore (NoSQL document store; subcollection-per-exercise model)
**Testing**: Vitest + Vue Test Utils (optional, not required for MVP)
**Target Platform**: Web browser, mobile-first (375px minimum viewport width)
**Project Type**: Single-page web application (SPA) — no server-side runtime
**Performance Goals**: Exercises screen interactive in <2s; auto-save completes within
2s of last user input; exercise detail screen loads in <2s
**Constraints**: No multi-device concurrent use; no offline-write queue (save failures
surfaced to user); TypeScript strict mode; no `any` without justification
**Scale/Scope**: Personal-use scale — single user per account; ~50 exercises,
hundreds of sessions per exercise over lifetime

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*
*References: Constitution v1.0.0*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity First | ✅ Pass | Core flow is 3 taps: exercises list → exercise detail → log sets. No speculative features. |
| II. Mobile-First, Touch-Optimized | ✅ Pass | Vuetify touch components; 375px min viewport; primary workflow ≤3 taps from main screen. |
| III. Data Integrity & Auto-Save | ✅ Pass | Debounced 2s auto-save; save failure surfaced via UI; soft-delete only (hidden flag). |
| IV. Per-User Data Isolation | ✅ Pass | Firestore rules scope all reads/writes to authenticated UID; enforced at rules layer. |
| V. Consistent, Predictable UX | ✅ Pass | German dates (DD.MM.YYYY); kg; 2.5 kg step; deterministic screen state on open. |
| Technology Stack | ✅ Pass | Vue 3 + Vuetify 3 + TypeScript strict + Firebase + Google Auth — no stack deviations. |

All gates pass. No complexity violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-training-tracker-app/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── firestore-schema.md
│   └── typescript-interfaces.ts
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── assets/                        # Static assets (icons, fonts)
├── components/
│   ├── exercises/
│   │   ├── ExerciseList.vue       # Draggable exercise list
│   │   ├── ExerciseListItem.vue   # Single row with edit/hide actions
│   │   ├── AddExerciseDialog.vue  # Add exercise dialog
│   │   ├── EditExerciseDialog.vue # Rename exercise dialog
│   │   └── HideExerciseDialog.vue # Hide confirmation dialog
│   └── session/
│       ├── SetRow.vue             # One set row (last weight/reps + new weight/reps)
│       └── AddSetButton.vue       # Append set row button
├── composables/
│   ├── useExercises.ts            # Exercise CRUD + ordering logic
│   └── useSession.ts              # Session load, set editing, auto-save debounce
├── router/
│   └── index.ts                   # Vue Router: /login, /exercises, /exercises/:id
├── services/
│   ├── auth.ts                    # Firebase Auth (Google sign-in/sign-out)
│   ├── exercises.ts               # Firestore reads/writes for exercises collection
│   └── sessions.ts                # Firestore reads/writes for sessions subcollection
├── stores/
│   ├── auth.ts                    # Pinia: current user state
│   └── exercises.ts               # Pinia: exercise list + ordering state
├── types/
│   └── index.ts                   # TypeScript interfaces (Exercise, Session, Set)
├── views/
│   ├── LoginView.vue              # Google sign-in screen
│   ├── ExercisesView.vue          # Main exercises list screen
│   └── ExerciseDetailView.vue     # Set logging screen
├── App.vue
└── main.ts

firestore.rules                    # Firestore security rules
firebase.json                      # Firebase project config
.env.local                         # Firebase env vars (gitignored)
```

**Structure Decision**: Single SPA project rooted at `src/`. Firebase is the sole
backend-as-a-service; no separate backend project is needed. Components are split by
screen domain (exercises vs session) to keep each independently navigable.

## Complexity Tracking

> No constitution violations. Section intentionally left blank.
