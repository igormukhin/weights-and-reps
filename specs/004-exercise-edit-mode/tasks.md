# Tasks: Exercise List Edit Mode

**Input**: Design documents from `/specs/004-exercise-edit-mode/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅

**Tests**: Not requested — manual validation per quickstart.md  
**Scope**: 2 files modified; no new files, no new dependencies, no Firestore changes

**Organization**: Tasks grouped by user story. T001 and T002 touch different files and can run in parallel.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on each other)
- **[Story]**: Which user story this task belongs to
- All paths relative to repo root

---

## Phase 2: User Story 1 — Clean Browse Mode (Priority: P1) 🎯 MVP

**Goal**: Exercise list defaults to browse mode — only exercise names visible; drag handle, rename (pencil), remove (eye-off) buttons, and add (+) FAB all hidden; empty state guides user to "Edit".

**Independent Test**: Load the exercise list; confirm no management controls are visible (no pencil, no eye-off, no drag handle, no + FAB); confirm tapping an exercise name navigates to the detail page; confirm app bar shows title "Weights & Reps".

### Implementation for User Story 1

- [x] T001 [P] [US1] Add `const isEditMode = ref<boolean>(false)` to the script in `src/views/ExercisesView.vue`; pass `:is-edit-mode="isEditMode"` prop on `<ExerciseListItem>` inside the draggable template; add `v-show="isEditMode"` to the add (+) FAB `<v-btn>`; change the empty-state message from `"Tap + to add your first exercise"` to `"Tap Edit to add your first exercise"` in `src/views/ExercisesView.vue`
- [x] T002 [P] [US1] Add `isEditMode: { type: Boolean, required: true }` to `defineProps` (replacing the plain `defineProps<{ exercise: Exercise }>()` with `withDefaults` or a typed props object) in `ExerciseListItem.vue`; add `v-show="isEditMode"` to the drag handle `<v-icon class="drag-handle ..."/>`; add `v-show="isEditMode"` to both action `<v-btn>` elements (pencil and eye-off); change the name click handler from `@click="router.push(...)"` to `@click="!isEditMode && router.push(\`/exercises/\${exercise.id}\`)"` in `src/components/exercises/ExerciseListItem.vue`

**Checkpoint**: Browse mode is fully clean — no management controls visible; exercise name tap navigates normally; empty state message references Edit.

---

## Phase 3: User Story 2 — Enter and Use Edit Mode (Priority: P2)

**Goal**: Tapping "Edit" in the app bar reveals all management controls and changes the app bar title to "Edit Exercises"; tapping "Done" reverts everything to browse mode.

**Independent Test**: Tap "Edit" in the app bar; confirm drag handles, pencil buttons, eye-off buttons, and + FAB all appear; confirm app bar title changes to "Edit Exercises" and the button label reads "Done"; tap "Done" and confirm all controls hide, title reverts to "Weights & Reps", and exercise name tap navigates again.

### Implementation for User Story 2

- [x] T003 [US2] In the `<v-app-bar>` template of `src/views/ExercisesView.vue`, add a `<v-btn>` in the `#append` slot (alongside the existing sign-out button) with label bound to `isEditMode ? 'Done' : 'Edit'`, `variant="text"`, and `@click="isEditMode = !isEditMode"`; bind the `<v-app-bar-title>` text to `isEditMode ? 'Edit Exercises' : 'Weights \u0026 Reps'` in `src/views/ExercisesView.vue`

**Checkpoint**: Full edit/browse toggle works; app bar title and button label update on every tap; all management controls show/hide correctly; tapping "Done" from edit mode restores clean browse state.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final manual validation

- [ ] T004 Run the full manual test checklist from `specs/004-exercise-edit-mode/quickstart.md` on a ≤375px viewport (Chrome DevTools → iPhone SE or similar); verify all browse mode, edit mode, action, exit, navigation-reset, and empty-state scenarios pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **US1 (Phase 2)**: No dependencies — T001 and T002 start immediately in parallel
- **US2 (Phase 3)**: Depends on T001 completing (requires `isEditMode` state and prop binding in place before adding the toggle button to the same file)
- **Polish (Phase 4)**: Depends on Phase 2 and Phase 3 completion

### User Story Dependencies

- **US1 (P1)**: No dependencies — T001 and T002 are parallel (different files)
- **US2 (P2)**: Depends on US1 (needs `isEditMode` ref from T001)

### Within Each Phase

- T001 and T002 are fully parallel (touch different files — no conflicts)
- T003 modifies the same file as T001; run after T001 completes

---

## Parallel Execution: User Story 1

```
# T001 and T002 touch different files — launch together:
Task T001: ExercisesView.vue — add isEditMode state, pass prop to child, hide FAB, update empty state
Task T002: ExerciseListItem.vue — add isEditMode prop, hide controls with v-show, guard name tap
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Run T001 + T002 in parallel
2. **STOP and VALIDATE**: Confirm browse mode is clean on ≤375px viewport
3. Proceed to T003 (User Story 2) once validated

### Incremental Delivery

1. T001 + T002 → Browse mode clean; US1 independently testable ✅
2. T003 → Edit/Done toggle functional; US2 independently testable ✅
3. T004 → Full quickstart.md checklist passes ✅

---

## Notes

- `[P]` tasks T001 and T002 modify different files — truly parallel, no conflict risk
- No new files, no new dependencies, no Firestore changes — pure UI toggle
- `isEditMode` resets to `false` on every page mount automatically (no `<keep-alive>` in router), satisfying FR-006 without any explicit reset logic
- Use `v-show` (not `v-if`) for the drag handle per research.md — preserves DOM structure for vuedraggable
- Total: 4 tasks across 2 source files
