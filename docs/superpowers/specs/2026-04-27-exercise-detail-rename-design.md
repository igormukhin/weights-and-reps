# Exercise Detail Rename Button — Design Spec

Date: 2026-04-27

## Overview

Add a pen icon button to the app bar of `ExerciseDetailView` so users can rename an exercise directly from the detail screen, without going through the exercise list edit mode.

## Behaviour

- A `mdiPencil` icon button sits in the app bar's `#append` slot, to the left of the existing save-status chip.
- Tapping it opens the existing `EditExerciseDialog`, pre-populated with the current exercise name.
- On successful save the dialog closes; the app bar title updates immediately because it is bound to the reactive Pinia store value.
- The user stays on the `ExerciseDetailView`.
- No new save feedback is needed — the dialog already handles errors inline.

## Components changed

| File | Change |
|---|---|
| `src/views/ExerciseDetailView.vue` | Import `EditExerciseDialog`; add `showRenameDialog` ref; add pen button + conditional dialog to template |

## No new components, routes, or store changes needed.

## Testing

- Add an e2e test: navigate to exercise detail, tap pen button, rename, verify app bar title updates.
