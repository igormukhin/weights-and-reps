# Data Model: Exercise List Edit Mode

**Date**: 2026-04-08  
**Branch**: `004-exercise-edit-mode`

## Firestore Changes

**None.** This feature is a pure UI state change. No new collections, documents, or fields are added to Firestore. No security rule changes required.

## UI State

The only new state is ephemeral (component-local, not persisted):

| State | Type | Location | Default | Lifetime |
|-------|------|----------|---------|----------|
| `isEditMode` | `boolean` | `ExercisesView.vue` (local `ref`) | `false` | Component mount/unmount — resets to `false` on every navigation to the exercises page |

## Prop Interface

`ExerciseListItem.vue` gains one new prop:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isEditMode` | `boolean` | Yes | When `true`, management controls are visible and name tap navigation is disabled |

Existing props (`exercise: Exercise`) are unchanged.
