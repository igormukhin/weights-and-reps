# Research: Exercise List Edit Mode

**Date**: 2026-04-08  
**Branch**: `004-exercise-edit-mode`

## Summary

No external research required. All decisions are resolved by the existing tech stack (constitution-locked) and the simplicity-first principle.

---

## Decision Log

### State Management for Edit Mode

- **Decision**: Local `ref<boolean> isEditMode` in `ExercisesView.vue`, passed to `ExerciseListItem` as a prop.
- **Rationale**: The state is shared between exactly one parent (`ExercisesView`) and one child (`ExerciseListItem`). Prop drilling is the simplest correct approach; no store or provide/inject is needed.
- **Alternatives considered**:
  - Pinia store: Rejected — overkill for a single boolean used by two co-located components. A store would persist state across navigation, which violates FR-006 (must reset on re-entry) unless manually cleared.
  - Vue `provide`/`inject`: Rejected — appropriate for deeply nested trees, not a two-level parent/child pair.

### Reset on Navigation

- **Decision**: No explicit reset logic needed. `ExercisesView.vue` is re-mounted on every navigation to `/exercises` (no `<keep-alive>` in the router). The `ref<boolean> isEditMode` initializes to `false` on every mount, satisfying FR-006 automatically.
- **Rationale**: Leverages Vue's component lifecycle rather than adding imperative reset code.

### App Bar Title Binding

- **Decision**: `ExercisesView.vue` already owns the `<v-app-bar>` and its title. The title is changed via a computed string bound to `v-app-bar-title`: `isEditMode ? 'Edit Exercises' : 'Weights & Reps'`.
- **Rationale**: Minimal change, idiomatic Vue reactive binding.

### Drag Handle Visibility in Browse Mode

- **Decision**: The drag handle (`mdi-drag` icon) is conditionally rendered via `v-show="isEditMode"` in `ExerciseListItem`. `v-show` is preferred over `v-if` here to avoid re-mounting the draggable list structure.
- **Rationale**: `v-show` preserves the DOM element and avoids layout shift during toggle; `v-if` on the handle would require no structural change.

### Name Tap Guard in Edit Mode

- **Decision**: The `@click` handler on `v-list-item-title` is conditionally no-op when `isEditMode` is true. Implementation: `@click="!isEditMode && router.push(...)"`  or a guard function.
- **Rationale**: Simplest approach; avoids adding a wrapper or disabling the element with CSS pointer-events.
