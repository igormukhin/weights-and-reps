# Exercise List: View/Edit Route Separation

**Date:** 2026-04-19
**Scope:** Refactor only — no new features. Clean code-level separation between view mode and edit mode on the exercise list (start) screen.

## Problem

`ExercisesView.vue` and `ExerciseListItem.vue` entangle both modes via `isEditMode` prop/state and `v-show` conditionals throughout. Upcoming view mode redesign requires touching shared code, risking regressions in edit mode.

## Goal

Edit mode becomes a closed capsule. New view mode features land in isolated files with zero overlap with edit code.

## Solution: Route-Based Separation

### Routes

| Path | Component | Notes |
|---|---|---|
| `/exercises` | `ExercisesView.vue` | View mode. New features land here. |
| `/exercises/edit` | `ExercisesEditView.vue` | Edit mode. Current code lives here. |
| `/exercises/:id` | `ExerciseDetailView.vue` | Unchanged. |

Both new routes carry `requiresAuth: true`. `/exercises/edit` is a flat sibling — no nested router-view.

### Component Changes

| File | Action | Notes |
|---|---|---|
| `src/views/ExercisesView.vue` | Modify | Strip all edit-mode code. "Edit" btn → `router.push('/exercises/edit')`. No `isEditMode`, no `draggable`, no FAB. |
| `src/views/ExercisesEditView.vue` | Create | Current `ExercisesView.vue` edit logic moved here verbatim. "Done" btn → `router.back()`. |
| `src/components/exercises/ExerciseListItem.vue` | Rename → `ExerciseListItemEdit.vue` | Remove `isEditMode` prop — component is always in edit context. |
| `src/components/exercises/ExerciseListItemView.vue` | Create | Minimal: exercise name + tap-to-navigate. No drag handle, no action buttons. |
| `src/components/exercises/AddExerciseDialog.vue` | Untouched | Used only by edit mode. |
| `src/components/exercises/EditExerciseDialog.vue` | Untouched | Used only by edit mode. |
| `src/components/exercises/HideExerciseDialog.vue` | Untouched | Used only by edit mode. |
| `src/composables/useExercises.ts` | Untouched | Shared by both modes. |
| `src/router/index.ts` | Modify | Add `/exercises/edit` route. |

### Data Flow

Both views read from `exercisesStore` (Pinia). No store changes needed. Edit view writes via `useExercises` composable as before.

### Navigation

- View mode "Edit" button: `router.push('/exercises/edit')`
- Edit mode "Done" button: `router.back()`
- Back navigation from edit lands on `/exercises` (view mode)

## Out of Scope

- New view mode UI features (separate spec)
- Any changes to `ExerciseDetailView.vue` or session logic
- Store or service layer changes
