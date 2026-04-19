# Exercise Groups Design

**Date:** 2026-04-19
**Feature:** Collapsible exercise groups on the home screen (ExercisesView)

## Overview

Split the flat exercise list into collapsible groups. Group name is derived from the exercise name prefix before the first colon. Only one group can be open at a time (accordion). All groups start collapsed.

## Name Parsing

- Input: `exercise.name`
- Split on the **first** `:` character
- If colon found: `group = name.slice(0, colonIndex).trim()`, `shortName = name.slice(colonIndex + 1).trim()`
- If no colon: `group = "(ungrouped)"`, `shortName = name`

Examples:
- `"Chest: Bench Press"` → group `"Chest"`, short name `"Bench Press"`
- `"Back: Pull-up"` → group `"Back"`, short name `"Pull-up"`
- `"Plank"` → group `"(ungrouped)"`, short name `"Plank"`

## Group Ordering

- Named groups sorted alphabetically (case-insensitive)
- `"(ungrouped)"` group always last
- Exercise order within each group preserves the original `position`-based order from the store

## UI Behaviour

- All groups collapsed on initial render (`modelValue` starts as `undefined`)
- Vuetify `v-expansion-panels` with `accordion` prop — one-open-at-a-time enforced natively
- Group header: group name, bold; chevron indicates open/closed state
- Exercise items inside open group: show `shortName` only (not full name)
- Tapping an item navigates to `/exercises/:id` (same as current flat list)

## Component Architecture

### New: `ExerciseGroupedList.vue`

- Location: `src/components/exercises/ExerciseGroupedList.vue`
- Props: `exercises: Exercise[]`
- Internal computed: `groups` — array of `{ name: string, exercises: { id: string, shortName: string }[] }`, sorted as above
- Renders: `v-expansion-panels accordion` with one `v-expansion-panel` per group
- Each panel header: group name
- Each panel body: `v-list` of exercise items (navigates on click)

### Modified: `ExercisesView.vue`

- Remove `v-list` + `ExerciseListItemView` import
- Add `<ExerciseGroupedList :exercises="exercises" />`
- No other changes to view logic

### Unchanged

- `ExerciseListItemView.vue` — still used by edit view, not touched
- Pinia store — no changes; grouping is a pure UI concern
- Data model — no changes

## Out of Scope

- Edit view grouping (ExercisesEditView) — not part of this feature
- Persisting last-open group across sessions
- Custom group labels or manual group assignment
