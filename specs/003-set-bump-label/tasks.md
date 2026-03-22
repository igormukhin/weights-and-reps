# Tasks: BumpIt Set Label

**Input**: Design documents from `/specs/003-set-bump-label/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, quickstart.md ✓

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2)

---

## Phase 1: Foundational (Blocking Prerequisite)

**Purpose**: Type system change that all other tasks depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 Add `bumpIt?: boolean` to the `Set` interface in `src/types/index.ts`

**Checkpoint**: `Set` type updated — US1 and US2 implementation can now begin.

---

## Phase 2: User Story 1 - Toggle BumpIt Label While Editing a Session (Priority: P1) 🎯 MVP

**Goal**: Users can tap a 🆙 emoji column in the session edit view to toggle the BumpIt label on any set. The emoji is semi-transparent when unlabeled and fully opaque when labeled. State persists via auto-save.

**Independent Test**: Open the session edit view, verify a semi-transparent 🆙 column appears between weight and reps for every set row. Tap it — verify it becomes fully opaque. Tap again — verify it returns to semi-transparent. Navigate away and back — verify the labeled state persisted to Firestore.

### Implementation for User Story 1

- [x] T002 [P] [US1] Add `toggleBumpIt(index: number)` function to `src/composables/useSession.ts`: flip `set.bumpIt`, call `scheduleSave()`, and expose it in the composable return value
- [x] T003 [P] [US1] Update `src/components/session/SetRow.vue`: add `bumpIt?: boolean` prop and `update:bumpIt: [value: boolean]` emit; add untitled 🆙 emoji column between weight and reps using a `v-btn` (variant="text", size="small") with `opacity: bumpIt ? 1 : 0.25`; update col layout from `1+6+5` to `1+5+1+5`
- [x] T004 [US1] Update `src/views/ExerciseDetailView.vue` edit mode: (a) update column header `v-row` from `cols="1/6/5"` to `cols="1/5/1/5"` with an empty header for the BumpIt column; (b) pass `:bump-it="set.bumpIt"` to each `<SetRow>`; (c) import and wire `toggleBumpIt` from `useSession`; (d) handle `@update:bump-it="() => toggleBumpIt(index)"` on `<SetRow>`

**Checkpoint**: US1 fully functional. Toggle works, persists within 2 seconds, and BumpIt carries over when starting a new session (automatic via existing `startSession()` spread).

---

## Phase 3: User Story 2 - View BumpIt Labels on Last Session Display (Priority: P2)

**Goal**: The read-only last session table always shows a 🆙 column to the right of weight. Sets with `bumpIt: true` display the emoji; others show an empty cell.

**Independent Test**: View the read-only last session display for a session previously saved with at least one BumpIt-labeled set. Verify 🆙 appears only for labeled sets. View a session with no labeled sets — verify the column is still rendered but all cells are empty.

### Implementation for User Story 2

- [x] T005 [US2] Update `src/views/ExerciseDetailView.vue` read-only table: (a) add an empty `<th>` column header after the Weight header; (b) add `<td>{{ set.bumpIt ? '🆙' : '' }}</td>` after the weight `<td>` in each row

**Checkpoint**: US1 and US2 both functional. All spec requirements met.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Mobile validation and layout verification.

- [ ] T006 Validate on mobile viewport (≤375px): confirm all four columns (#, weight, 🆙, reps) are readable in edit mode; confirm BumpIt button tap area meets ≥44×44px; confirm read-only table renders correctly with the new column — REQUIRES MANUAL VALIDATION

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately
- **User Story 1 (Phase 2)**: Requires T001 complete — T002 and T003 run in parallel; T004 requires T002 + T003
- **User Story 2 (Phase 3)**: Requires T001 complete — T005 runs after T004 (same file)
- **Polish (Phase 4)**: Requires T004 + T005 complete

### Task Dependency Graph

```
T001
├── T002 [P]  ─┐
└── T003 [P]  ─┤─→ T004 ─→ T005 ─→ T006
```

### Parallel Opportunities

After T001 completes:
- T002 (`useSession.ts`) and T003 (`SetRow.vue`) can run in parallel — different files, no shared state

---

## Parallel Example: User Story 1

```
After T001:
  Task A: T002 — Add toggleBumpIt to src/composables/useSession.ts
  Task B: T003 — Update src/components/session/SetRow.vue
  (both in parallel)

Then:
  Task: T004 — Wire everything in src/views/ExerciseDetailView.vue
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001: Type change
2. Complete T002 + T003 in parallel
3. Complete T004
4. **STOP and VALIDATE**: Toggle works, persists, carries over on new session
5. Ship US1 if ready

### Incremental Delivery

1. T001 → Foundation ready
2. T002 + T003 (parallel) → T004 → US1 complete (toggle BumpIt in edit mode) ✓
3. T005 → US2 complete (view BumpIt on last session display) ✓
4. T006 → Polish complete ✓

---

## Notes

- No new files to create — all changes are modifications to existing files
- No Firestore rules changes needed — existing wildcard rule already covers `bumpIt`
- No migration needed — absent `bumpIt` is treated as `false` everywhere
- `startSession()` carry-over is automatic via object spread (no code change required for FR-010)
- [P] tasks operate on different files and have no shared mutable state
