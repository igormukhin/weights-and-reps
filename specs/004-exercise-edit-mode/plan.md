# Implementation Plan: Exercise List Edit Mode

**Branch**: `004-exercise-edit-mode` | **Date**: 2026-04-08 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/004-exercise-edit-mode/spec.md`

## Summary

Add a browse/edit mode toggle to the exercise list page. In browse mode (default), all management controls (add FAB, per-exercise rename and remove buttons, drag handles) are hidden — only exercise names are visible. Tapping "Edit" in the app bar reveals all management controls and changes the app bar title to "Edit Exercises". Tapping "Done" returns to browse mode. No new data model, no new dependencies, no Firestore changes.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: Vue 3 (Composition API), Vuetify 3, vuedraggable  
**Storage**: N/A (no data model changes)  
**Testing**: Manual — mobile viewport (≤375px) validation per constitution  
**Target Platform**: Mobile web (primary), ≤375px wide  
**Project Type**: Mobile web app  
**Performance Goals**: No new data fetching; UI-only change  
**Constraints**: Simplicity First — no new dependencies; no new abstractions  
**Scale/Scope**: 2 files modified (`ExercisesView.vue`, `ExerciseListItem.vue`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Constitution Version**: 1.0.0

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity First | ✅ PASS | Feature reduces UI clutter; directly serves "fastest, simplest logging" mandate |
| II. Mobile-First, Touch-Optimized | ✅ PASS | Edit/Done button in app bar; all touch targets preserved; no hover-only patterns |
| III. Data Integrity & Auto-Save | ✅ PASS | No data model changes; no new save operations |
| IV. Per-User Data Isolation | ✅ PASS | No Firestore rule changes needed |
| V. Consistent, Predictable UX | ✅ PASS | Mode resets to browse on every page entry; deterministic state |

No violations. Complexity Tracking section not required.

## Project Structure

### Documentation (this feature)

```text
specs/004-exercise-edit-mode/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (files changed)

```text
src/
├── views/
│   └── ExercisesView.vue              # isEditMode state; app bar Edit/Done + title; FAB visibility; empty state text
└── components/exercises/
    └── ExerciseListItem.vue            # isEditMode prop; conditional drag handle, rename, remove; name tap guard
```

No new files. No new directories. No new dependencies.

**Structure Decision**: Single-project Vue app. `isEditMode` is a local `ref<boolean>` in `ExercisesView.vue`, passed down to `ExerciseListItem` as a prop. No store needed — the state is scoped to a single parent/child pair, and YAGNI applies.
