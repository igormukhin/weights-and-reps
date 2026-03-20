---

description: "Task list for Weights and Reps — Training Tracker App"
---

# Tasks: Weights and Reps — Training Tracker App

**Input**: Design documents from `/specs/001-training-tracker-app/`
**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, contracts/ ✅, research.md ✅

**Tests**: Not requested in spec — no test tasks generated.

**Organization**: Tasks are grouped by user story to enable independent implementation
and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths are included in all task descriptions

## Path Conventions

- Single SPA project: `src/` at repository root
- No separate backend; Firebase is the BaaS layer

---

## Phase 1: Setup (Project Scaffolding)

**Purpose**: Initialize the project and install all dependencies before any feature work begins.

- [ ] T001 Initialize Vite + Vue 3 + TypeScript project at repository root (`npm create vite@latest . -- --template vue-ts`)
- [ ] T002 Install and configure Vuetify 3: `npm install vuetify@^3 @mdi/font`; create `src/plugins/vuetify.ts` with theme config and register in `src/main.ts`
- [ ] T003 [P] Install Firebase JS SDK v10: `npm install firebase`; create `src/services/firebase.ts` that initialises the Firebase app from `import.meta.env` variables
- [ ] T004 [P] Install Vue Router 4 and Pinia: `npm install vue-router@^4 pinia`; register both in `src/main.ts`
- [ ] T005 [P] Install vuedraggable@next: `npm install vuedraggable@next`
- [ ] T006 Create `.env.example` at repo root documenting all required `VITE_FIREBASE_*` keys (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`); add `.env.local` to `.gitignore`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Auth, routing, Firestore rules, and shared types that MUST exist before any user story screen can function.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T007 [P] Create all TypeScript interfaces in `src/types/index.ts` exactly as specified in `specs/001-training-tracker-app/contracts/typescript-interfaces.ts` (`Set`, `Session`, `Exercise`, `CreateExercisePayload`, `RenameExercisePayload`, `SaveSessionPayload`, `SaveStatus`, `SessionState`)
- [ ] T008 Write `firestore.rules` at repo root with the per-user UID isolation rule from `specs/001-training-tracker-app/contracts/firestore-schema.md`; add `firebase.json` with Firestore rules pointer
- [ ] T009 Implement auth service in `src/services/auth.ts`: `signInWithGoogle()` (GoogleAuthProvider popup), `signOut()`, `onAuthStateChanged` listener export
- [ ] T010 [P] Create Pinia auth store in `src/stores/auth.ts`: `currentUser: User | null`, `isAuthenticated: boolean`, `setUser(user)` action; init auth listener on store creation
- [ ] T011 Configure Vue Router in `src/router/index.ts`: routes `/login` → `LoginView`, `/exercises` → `ExercisesView`, `/exercises/:id` → `ExerciseDetailView`; `beforeEach` guard redirects unauthenticated users to `/login` and authenticated users away from `/login` to `/exercises`
- [ ] T012 Create `src/App.vue` with `<router-view>` and a `watchEffect` that syncs Firebase `onAuthStateChanged` into the auth store
- [ ] T013 Create `src/views/LoginView.vue`: centered Vuetify card with app title and "Sign in with Google" button that calls `signInWithGoogle()` from auth service

**Checkpoint**: Firebase initialised, auth guard active, sign-in screen functional — all user story screens are now reachable after sign-in.

---

## Phase 3: User Story 1 + 3 — Log a Workout Session & View Last Session Reference (Priority: P1 / P3) 🎯 MVP

**Goal**: User can open an exercise, see previous session data as read-only reference,
enter weight and reps for each set, and have data auto-saved within 2 seconds.

**Independent Test**: Sign in, seed one exercise in Firestore (or use Firestore console),
open it, enter values, wait 2 seconds — verify data appears in Firestore. Navigate away
and return — verify "new" fields restore today's values and "last" fields show the
previous session.

### Implementation for User Story 1 + 3

- [ ] T014 [P] [US1] Implement Firestore exercises service (read path only for now) in `src/services/exercises.ts`: `getExercises(uid)` returns non-hidden exercises ordered by `position`; `getExerciseById(uid, id)` returns a single exercise document
- [ ] T015 [P] [US1] Implement Firestore sessions service in `src/services/sessions.ts`: `getTodaySession(uid, exerciseId, dateStr)` (point lookup); `getLastSession(uid, exerciseId, todayStr)` (orderBy date desc, limit 2, return the non-today result); `saveSession(uid, exerciseId, payload: SaveSessionPayload)` (setDoc with merge)
- [ ] T016 [P] [US1] Create Pinia exercises store in `src/stores/exercises.ts`: `exercises: Exercise[]` state; `loadExercises(uid)` action calling exercises service; `getById(id)` getter
- [ ] T017 [US1] Create `useSession` composable in `src/composables/useSession.ts`: on mount, call `getTodaySession` and `getLastSession`; compute initial set rows (match previous session set count, default 3 if no history); expose `todaySets`, `lastSets`, `lastSessionDate` (formatted DD.MM.YYYY), `saveStatus`, `saveError`, `updateSet(index, field, value)`, `addSet()` as per `SessionState` interface
- [ ] T018 [US1] Add auto-save debounce to `useSession` composable in `src/composables/useSession.ts`: `watchEffect` with manual `setTimeout`/`clearTimeout` (2000ms); on fire, filter empty set rows (weight < 0.5 or reps < 1 treated as empty), call `saveSession`; set `saveStatus` through `'saving'` → `'saved'` or `'error'`; expose error message in `saveError`
- [ ] T019 [P] [US1] Create `SetRow.vue` in `src/components/session/SetRow.vue`: props `setNumber`, `lastWeight`, `lastReps`, `newWeight`, `newReps`; emits `update:newWeight` and `update:newReps`; Vuetify text fields for new values; `+`/`-` icon buttons (step 2.5 for weight, step 1 for reps); tap on empty new-weight or new-reps field triggers prefill from previous set (parent passes `prevNewWeight`/`prevNewReps` props); last weight/reps shown as read-only text
- [ ] T020 [P] [US1] Create `AddSetButton.vue` in `src/components/session/AddSetButton.vue`: Vuetify outlined button labelled "+ Add set"; emits `add-set` event on click
- [ ] T021 [US1] Create `ExercisesView.vue` in `src/views/ExercisesView.vue` (minimal for US1 navigation): on mount load exercises from store; show scrollable list of exercise names as tappable rows; navigate to `/exercises/:id` on tap; show empty-state prompt ("Add your first exercise") when list is empty
- [ ] T022 [US1] Create `ExerciseDetailView.vue` in `src/views/ExerciseDetailView.vue`: read `:id` from route; load exercise from store; instantiate `useSession(uid, exerciseId)`; render header (exercise name + last session date); render `SetRow` for each set in `todaySets` passing corresponding `lastSets[i]` values; render `AddSetButton`; render save status indicator (subtle chip or text: "Saving…" / "Saved" / error snackbar with message)

**Checkpoint**: User can sign in, see an exercise (must exist in Firestore), open it, enter
weights and reps, and data auto-saves. Last session values are visible as read-only reference.

---

## Phase 4: User Story 2 — Manage the Exercise List (Priority: P2)

**Goal**: User can add exercises (with smart prefix-match insertion), rename them
(capitalisation-only rename allowed), hide them (permanent, with confirmation), and
drag to reorder.

**Independent Test**: Add "Bench Press", add "Bench Press Incline" — verify it appears
directly after "Bench Press". Rename "Bench Press" to "Bench Press Barbell" — verify
success. Rename to existing name — verify rejection. Hide an exercise — verify
confirmation dialog and disappearance from list. Drag an exercise to a new position
and reload — verify order persists.

### Implementation for User Story 2

- [ ] T023 [P] [US2] Extend exercises service in `src/services/exercises.ts`: add `createExercise(uid, name, position)`, `renameExercise(uid, id, newName)`, `hideExercise(uid, id)`, `updatePositions(uid, exercises: Pick<Exercise, 'id' | 'position'>[])` (Firestore batch write)
- [ ] T024 [US2] Create `useExercises` composable in `src/composables/useExercises.ts`: wraps exercises store and service; implements `addExercise(name)` (duplicate check case-insensitive against all non-hidden exercises, then prefix-match position calculation, then `createExercise`, then reload store); `renameExercise(id, newName)` (check uniqueness against other exercises only — capitalisation-only change on own name allowed); `hideExercise(id)`; `reorder(newList: Exercise[])` (re-index positions 1…n, batch update via `updatePositions`)
- [ ] T025 [US2] Implement prefix-match insertion in `useExercises.ts` `addExercise` method: iterate non-hidden exercises in position order; find the exercise `E` where `newName.toLowerCase().startsWith(E.name.toLowerCase())` and `E.name.length` is maximised; insert new exercise at `E.position + 1` and shift all subsequent exercises up by 1 before the batch write
- [ ] T026 [P] [US2] Create `AddExerciseDialog.vue` in `src/components/exercises/AddExerciseDialog.vue`: Vuetify dialog; name text field; validates non-empty and unique (case-insensitive) on submit; calls `useExercises.addExercise`; shows validation error inline; emits `close` on success or cancel
- [ ] T027 [P] [US2] Create `EditExerciseDialog.vue` in `src/components/exercises/EditExerciseDialog.vue`: Vuetify dialog pre-filled with current name; validates uniqueness against other exercises only (capitalisation-only change to own name allowed); calls `useExercises.renameExercise`; shows validation error inline; emits `close` on success or cancel
- [ ] T028 [P] [US2] Create `HideExerciseDialog.vue` in `src/components/exercises/HideExerciseDialog.vue`: Vuetify confirmation dialog with message explicitly stating hiding is permanent and cannot be undone in the app; confirm and cancel buttons; calls `useExercises.hideExercise` on confirm; emits `close`
- [ ] T029 [US2] Create `ExerciseListItem.vue` in `src/components/exercises/ExerciseListItem.vue`: displays exercise name; drag handle icon (for vuedraggable); edit icon button (opens `EditExerciseDialog`); hide icon button (opens `HideExerciseDialog`); tap on name row navigates to `/exercises/:id`
- [ ] T030 [US2] Update `ExercisesView.vue` in `src/views/ExercisesView.vue`: replace plain list with `vuedraggable` list of `ExerciseListItem` components; wire drag-end event to `useExercises.reorder`; wire "Add exercise" FAB to open `AddExerciseDialog`; preserve empty-state prompt from T021

**Checkpoint**: Full exercise management functional: add (with prefix-match insertion),
rename, hide (with confirmation), drag-to-reorder persisted across sessions.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final quality pass across all screens.

- [ ] T031 [P] Add `<meta name="viewport" content="width=device-width, initial-scale=1">` to `index.html`; configure Vuetify display breakpoints for mobile-first in `src/plugins/vuetify.ts`
- [ ] T032 [P] Create date formatting utility `formatGermanDate(isoDateStr: string): string` (converts `YYYY-MM-DD` to `DD.MM.YYYY`) in `src/utils/date.ts`; replace any inline date formatting in `ExerciseDetailView.vue` and `useSession.ts` with this utility
- [ ] T033 Deploy Firestore security rules (`firebase deploy --only firestore:rules`) and run the full manual walkthrough from `specs/001-training-tracker-app/quickstart.md` to validate end-to-end
- [ ] T034 [P] Clean up `src/App.vue` and remove Vite scaffold boilerplate files (`src/components/HelloWorld.vue`, `src/assets/vue.svg`, etc.)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; T003, T004, T005 can run in parallel
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories; T007 and T010 can run in parallel with T008–T009 sequence
- **US1 + US3 (Phase 3)**: Depends on Foundational completion; T014, T015, T016 can run in parallel; T017 depends on T015; T018 depends on T017; T019, T020 can run in parallel; T021 depends on T016; T022 depends on T017, T018, T019, T020, T021
- **US2 (Phase 4)**: Depends on Phase 3 completion (exercises service and store must exist); T023, T026, T027, T028 can run in parallel; T024 depends on T023; T025 is part of T024; T029 depends on T026–T028; T030 depends on T024 and T029
- **Polish (Phase 5)**: Depends on all story phases; T031, T032, T034 can run in parallel; T033 last

### User Story Dependencies

- **US1 + US3 (P1/P3)**: Can start after Foundational — minimal exercises service (read-only) needed
- **US2 (P2)**: Can start after US1 — extends the exercises service and exercises view built in US1
- **US4 (P4)**: Fully implemented in Foundational phase (auth service, auth store, login view, router guard)

### Within Each Phase

- Models / types before services
- Services before composables
- Composables before views
- Core implementation before polish

---

## Parallel Execution Examples

### Phase 1 Parallel

```
Parallel:
  Task: "Install Firebase JS SDK v10 — T003"
  Task: "Install Vue Router 4 and Pinia — T004"
  Task: "Install vuedraggable@next — T005"
Sequential after:
  Task: "Create .env.example — T006"
```

### Phase 3 Parallel (after Foundational complete)

```
Parallel group A:
  Task: "Implement exercises service (read) — T014"
  Task: "Implement sessions service — T015"
  Task: "Create exercises store — T016"

Sequential: T017 (useSession) → T018 (auto-save in useSession)

Parallel group B (while T017/T018 in progress):
  Task: "Create SetRow.vue — T019"
  Task: "Create AddSetButton.vue — T020"

Sequential: T021 (ExercisesView) → T022 (ExerciseDetailView)
```

### Phase 4 Parallel

```
Parallel group A:
  Task: "Extend exercises service — T023"
  Task: "Create AddExerciseDialog.vue — T026"
  Task: "Create EditExerciseDialog.vue — T027"
  Task: "Create HideExerciseDialog.vue — T028"

Sequential after T023: T024 (useExercises) → T025 (prefix-match)

Sequential after T026–T028: T029 (ExerciseListItem) → T030 (update ExercisesView)
```

---

## Implementation Strategy

### MVP First (US1 + US3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 + US3
4. **STOP and VALIDATE**: Sign in → open exercise (seeded manually in Firestore) → log sets → verify auto-save → navigate away → return → verify data restored + last session visible
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → auth and login screen live
2. US1 + US3 → full logging workflow live (MVP)
3. US2 → full exercise management live
4. Polish → production-ready

---

## Notes

- `[P]` tasks operate on different files with no incomplete dependencies
- `[Story]` label maps each task to its user story for traceability
- US4 (auth) is implemented entirely within the Foundational phase — it has no separate phase because it is pure infrastructure
- The exercises service is extended incrementally: read-only in Phase 3 (T014), write operations added in Phase 4 (T023)
- Commit after each checkpoint to preserve working increments
- `firestore.rules` must be deployed before any end-to-end validation (T033)
