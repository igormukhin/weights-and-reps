# Tasks: Exercise Detail Page Redesign

**Input**: Design documents from `/specs/002-exercise-detail-redesign/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/useSession-api.md ✅

**Tests**: No automated test tasks — manual mobile viewport validation included in Polish phase per project convention.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. No new project infrastructure is required — this is a modification of an existing Vue 3 + Firebase application.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- No Setup phase needed — existing project structure is sufficient

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Core composable state change that ALL user stories depend on. Must complete before any UI work.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 Modify `src/composables/useSession.ts`: add `hasTodaySession: Ref<boolean>` reactive state initialized to `false`; update `init()` so that when no today session exists it sets `hasTodaySession = false` and leaves `todaySets.value = []` (no pre-fill of empty rows — remove the `DEFAULT_SET_COUNT` fallback rows logic); when today session exists set `hasTodaySession = true` and populate `todaySets` from today's sets as before; add `hasTodaySession` to the composable return value

**Checkpoint**: `useSession` now exposes `hasTodaySession`. The existing edit-mode UI still renders (breakage expected until Phase 2 wires modes) — but `hasTodaySession` is available for view layer consumption.

---

## Phase 2: User Story 1 + 3 — Read-Only Mode & Auto-Edit Detection (Priority: P1)

**Goal**: The exercise detail page loads in read-only mode (static last session table + "Pump it!" placeholder) when no today session exists, and automatically shows edit mode when today session already exists. Covers both US1 and US3 since auto-edit detection is the inverse of read-only: they share the same `hasTodaySession` switch.

**Independent Test**: Navigate to an exercise with a past session but no today session — see read-only table. Create a today session externally in Firestore, reload — page loads directly in edit mode showing today's sets.

- [x] T002 [US1] Restructure `src/views/ExerciseDetailView.vue` template to have two conditional sections driven by `hasTodaySession`: a `v-if="!hasTodaySession"` read-only section and a `v-else` edit section; move the existing SetRow loop, AddSetButton, and column headers into the edit section (`v-else`); leave the read-only section empty (placeholder) — no logic added yet in this task

- [x] T003 [US1] Implement the read-only section in `src/views/ExerciseDetailView.vue`: display the last session date using the existing `lastSessionDate` ref (formatted DD.MM.YYYY, already provided by composable); render a static Vuetify grid table of `lastSets` showing columns: set number (#), weight (kg), reps — use `v-row`/`v-col` with `text-caption` headers matching the existing column style; if `lastSets` is empty and `lastSessionDate` is empty, show the empty-state message "No sessions recorded yet"; the read-only section must not contain any input fields

**Checkpoint (US1 + US3)**: Navigate to exercise with only past sessions → read-only table shown with correct date and sets. Navigate to exercise with today's session in Firestore → edit mode auto-loaded with today's sets. Both modes are independently verifiable.

---

## Phase 3: User Story 2 — "Pump it!" & startSession (Priority: P1)

**Goal**: User clicks "Pump it!" to create today's session pre-filled with last session's data and enters edit mode.

**Independent Test**: Click "Pump it!" on an exercise with a past session → edit mode opens with last session's sets pre-filled (weight + reps copied). Click "Pump it!" on an exercise with no past session → edit mode opens with empty table. Refresh the page after clicking without editing → edit mode still shown (session persisted immediately).

- [x] T004 [US2] Add `startSession()` async function to `src/composables/useSession.ts`: copy `lastSets.value` entries into `todaySets.value` (map each `Set` to a `Partial<Set>` with weight and reps copied); if `lastSets.value` is empty, leave `todaySets.value = []`; then call `persist()` immediately (non-debounced, same existing function) to write the session to Firestore; finally set `hasTodaySession.value = true`; export `startSession` from the composable return value

- [x] T004b [US2] Add `removeSet(index: number)` function to `src/composables/useSession.ts`: splice `todaySets.value` at the given index (removes 1 element); call `scheduleSave()` after removal; export `removeSet` from the composable return value. Then add a remove icon button (`mdi-close` or `mdi-minus`) to each set row in the edit section of `src/views/ExerciseDetailView.vue`, wired to `removeSet(index)` — place it as an additional column in the existing row layout

- [x] T005 [US2] Add "Pump it!" button to the read-only section in `src/views/ExerciseDetailView.vue`: use a `v-btn` with color="primary", block layout, and label "Pump it!"; place it below the last session table (or empty state message); wire `@click` to the `startSession` function from `useSession`; import `startSession` from the composable destructure

**Checkpoint (US2)**: Full "Pump it!" flow works end-to-end. Pre-fill from last session verified. Immediate Firestore persist verified by refreshing the page.

---

## Phase 4: User Story 4 — Delete Today's Session with Confirmation (Priority: P3)

**Goal**: User in edit mode can delete today's session with a confirmation dialog. Page returns to read-only after deletion.

**Independent Test**: While in edit mode for today's session, click Delete → confirmation dialog appears. Confirm → session deleted from Firestore, page shows read-only with previous session data. Cancel → no change, stay in edit mode.

- [x] T006 [P] [US4] Add `deleteSession(uid, exerciseId, dateStr)` function to `src/services/sessions.ts`: import `deleteDoc` from `firebase/firestore`; implement as `await deleteDoc(doc(db, 'users', uid, 'exercises', exerciseId, 'sessions', dateStr))`; export the function

- [x] T007 [US4] Add `deleteSession()` async function to `src/composables/useSession.ts`: import the new `deleteSession` service function (requires T006 to be complete); implement: call `deleteSession(uid, exerciseId, todayISO())`; on success reset `hasTodaySession.value = false` and `todaySets.value = []` (do not clear `lastSets` or `lastSessionDate`); on Firestore error set `saveStatus.value = 'error'` and `saveError.value = 'Failed to delete. Check your connection.'`; export `deleteSession` from the composable return value

- [x] T008 [P] [US4] Create `src/components/session/DeleteSessionDialog.vue`: Vuetify `v-dialog` component with `v-model` prop (`modelValue: boolean`); dialog body text "Delete today's session? This cannot be undone."; two action buttons: "Cancel" (emits `update:modelValue` with `false`) and "Delete" (variant="tonal", color="error", emits `confirm` event and closes dialog); follow the existing dialog pattern in `src/components/exercises/HideExerciseDialog.vue` for structure

- [x] T009 [US4] Wire delete flow into `src/views/ExerciseDetailView.vue`: import `DeleteSessionDialog`; add a `showDeleteDialog` ref (`ref(false)`); add a "Delete" `v-btn` (color="error", variant="tonal") inside the edit section (`v-else` block — no additional `v-if` needed, the section gate already ensures this button only shows in edit mode); the button sets `showDeleteDialog = true`; place `<DeleteSessionDialog>` in the template with `v-model="showDeleteDialog"` and `@confirm="handleDelete"`; implement `handleDelete()` as an async function that calls `deleteSession()` from the composable

**Checkpoint (US4)**: Full delete flow works. Confirmation dialog shown. Deletion removes Firestore document and page reverts to read-only. Cancel dismisses dialog with no changes.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validation and edge-case hardening across all implemented stories.

- [ ] T010 Manually validate all three page states on a mobile viewport (≤375px wide): read-only with past session data, read-only empty state (no sessions), edit mode with pre-filled sets — verify touch targets are comfortable and no layout overflow occurs

- [ ] T011 Validate auto-save 2-second window: in edit mode, modify a set field and verify the save-status chip shows "Saving…" then "Saved" within 2 seconds; also verify that clicking "Pump it!" persists the session immediately (before 2 seconds) by checking Firestore or refreshing immediately after click

- [ ] T012 Validate error states: with DevTools network throttling set to offline, click "Pump it!" and verify a graceful error is shown; in edit mode go offline and modify a set — verify the error indicator appears without losing the in-progress input value

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately
- **US1+US3 (Phase 2)**: Depends on Phase 1 (T001) — BLOCKED until hasTodaySession is available
- **US2 (Phase 3)**: Depends on Phase 2 (T002, T003) — "Pump it!" button goes in the read-only section
- **US4 (Phase 4)**: Depends on Phase 1 (T001) — T006 and T008 can run in parallel with Phase 2/3 work; T007 depends on T006 (imports from it); T009 depends on T006, T007, T008 all being done
- **Polish (Phase 5)**: Depends on all user story phases being complete

### User Story Dependencies

- **US1 + US3 (P1)**: Depend on Foundational (T001)
- **US2 (P1)**: Depends on US1+US3 (T002, T003) — button lives in read-only section
- **US4 (P3)**: T006 and T008 depend only on Foundational (T001) and can start immediately after; T007 depends on T006 (imports the service function); T009 depends on T006, T007, T008 all being done

### Parallel Opportunities

- T006 and T008 (US4 prep) can run in parallel with each other and with Phase 2/3 work; T007 must follow T006
- T002 and T003 can be done sequentially within Phase 2 (same file, order matters)

---

## Parallel Example: User Story 4

```
# After T001 completes, these two tasks can run concurrently:
Task T006: Add deleteSession() to src/services/sessions.ts
Task T008: Create src/components/session/DeleteSessionDialog.vue

# After T006 completes:
Task T007: Add deleteSession() to src/composables/useSession.ts  ← depends on T006

# After T006, T007, T008 all complete:
Task T009: Wire delete flow in src/views/ExerciseDetailView.vue
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Foundational (T001)
2. Complete Phase 2: US1+US3 read-only mode (T002, T003)
3. Complete Phase 3: US2 "Pump it!" (T004, T005)
4. **STOP and VALIDATE**: Full read/write flow works — view last session, start new session, auto-save, auto-return to edit mode on revisit
5. Demo / ship MVP if desired

### Full Incremental Delivery

1. Phase 1 → Foundation ready
2. Phase 2 → Read-only mode + auto-edit (US1, US3) — testable independently
3. Phase 3 → "Pump it!" + pre-fill (US2) — testable independently
4. Phase 4 → Delete flow (US4) — testable independently
5. Phase 5 → Polish & validation

---

## Notes

- [P] tasks operate on different files and have no inter-dependencies
- [Story] label maps each task to the user story it delivers
- No automated tests in this project — manual validation per constitution workflow
- Commit after each checkpoint to preserve incremental progress
- `hasTodaySession` is the single source of truth for mode detection — never derive mode from other state
- `startSession()` must always call `persist()` non-debounced to guarantee session existence before navigation
