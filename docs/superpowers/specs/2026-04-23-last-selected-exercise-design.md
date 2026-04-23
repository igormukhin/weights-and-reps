# Last Selected Exercise Highlight — Design Spec

**Date:** 2026-04-23
**Feature:** Remember and highlight the last selected exercise on the home screen

---

## Overview

When the user taps an exercise and returns to the home screen, the app should visually indicate which exercise they last visited: its group panel opens automatically, the exercise row is highlighted, and the list scrolls it into view.

---

## Behavior

- **Trigger:** Tapping an exercise in `ExerciseGroupedList` sets it as the last selected exercise.
- **On return to home screen:** The group panel containing that exercise starts open; the exercise row is highlighted; the list scrolls to put it in view.
- **Highlight duration:** Persists for the entire time the user is on the home screen (`/exercises`). Clears when they navigate away (to a detail view, edit view, or any other route).
- **Persistence:** Survives page refresh via `sessionStorage`. Clears when the browser tab is closed.

---

## State: exercises store (`src/stores/exercises.ts`)

Add a single field:

```ts
const lastSelectedExerciseId = ref<string | null>(
  sessionStorage.getItem('lastSelectedExerciseId') ?? null
)
```

Two new actions:

```ts
function setLastSelected(id: string): void {
  lastSelectedExerciseId.value = id
  sessionStorage.setItem('lastSelectedExerciseId', id)
}

function clearLastSelected(): void {
  lastSelectedExerciseId.value = null
  sessionStorage.removeItem('lastSelectedExerciseId')
}
```

Expose `lastSelectedExerciseId` (readonly ref), `setLastSelected`, and `clearLastSelected` from the store.

---

## Navigation: `ExerciseGroupedList.vue`

**Setting selection** — in the existing click handler, call `setLastSelected` before routing:

```ts
function selectExercise(id: string): void {
  exercisesStore.setLastSelected(id)
  router.push(`/exercises/${id}`)
}
```

**Clearing selection** — `onUnmounted`, call `clearLastSelected()`. This fires whenever the user leaves the `/exercises` route.

---

## UI: `ExerciseGroupedList.vue`

### 1. Open the correct group panel

Add `v-model` to `v-expansion-panels`, initialized to the index of the group containing `lastSelectedExerciseId`. Because this is the initial render (not a user-triggered toggle), the panel opens without animation.

```ts
const idx = groups.value.findIndex(g =>
  g.exercises.some(e => e.id === exercisesStore.lastSelectedExerciseId)
)
const openPanel = ref<number | undefined>(idx >= 0 ? idx : undefined)
```

`findIndex` returns `-1` when the exercise isn't found (e.g. hidden or deleted since the session was stored) — coerced to `undefined` so all panels start closed. The `v-model` is bound to `openPanel` (not recomputed) so the user can freely open and close groups after the initial render.

### 2. Highlight the selected row

Add a `selected` class to the matching list item:

```html
<v-list-item
  :class="['exercise-item', 'pa-0', { selected: exercise.id === exercisesStore.lastSelectedExerciseId }]"
  ...
/>
```

CSS (scoped):

```css
.exercise-item.selected {
  background: rgba(var(--v-theme-primary), 0.08);
  border-left: 3px solid rgb(var(--v-theme-primary));
  padding-left: 13px; /* offset to compensate for border width */
}
```

### 3. Scroll into view

Use a template ref on the matching item and scroll after mount:

```ts
const selectedItemEl = ref<InstanceType<typeof VListItem> | null>(null)

onMounted(async () => {
  await nextTick()
  selectedItemEl.value?.$el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
})
```

Template ref binding (only set for the selected item):

```html
<v-list-item
  :ref="exercise.id === exercisesStore.lastSelectedExerciseId ? (el) => { selectedItemEl = el as any } : undefined"
  ...
/>
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/stores/exercises.ts` | Add `lastSelectedExerciseId` ref, `setLastSelected`, `clearLastSelected` |
| `src/components/exercises/ExerciseGroupedList.vue` | Add `v-model` on panels, `selected` class + CSS, template ref + scroll, `onUnmounted` clear |

No new files. No router changes. No changes to `ExercisesView.vue` or `ExerciseDetailView.vue`.

---

## Testing

- E2E test: tap an exercise → navigate back → verify the group is open, the item has the `selected` class, and is visible in the viewport.
- E2E test: tap an exercise → refresh the page → same result (sessionStorage persistence).
- E2E test: tap exercise A → navigate back → tap exercise B → navigate back → verify exercise A highlight is gone, exercise B is highlighted.
