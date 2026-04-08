# Tasks: E2E Test Automation Setup

**Input**: Design documents from `/specs/005-e2e-test-setup/`  
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅

**Tests**: No separate test tasks — this feature *is* test infrastructure. Tasks produce the tests directly.

**Organization**: Tasks are grouped by user story. US1 = Infrastructure Bootstrap (P1); US2 = Add Exercise E2E Test (P2).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[US1]/[US2]**: Which user story this task belongs to

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install test dependencies and establish the new file structure.

- [x] T001 Install Playwright devDependency: `npm install -D @playwright/test` in project root (`package.json`)
- [x] T002 [P] Install firebase-tools devDependency: `npm install -D firebase-tools` in project root (`package.json`)
- [x] T003 Install Playwright's Chromium browser: `npx playwright install chromium` (updates `.playwright/` cache)

**Checkpoint**: `package.json` contains `@playwright/test` and `firebase-tools` in devDependencies.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Configure Firebase emulator support in the app and establish the test environment. **Must be complete before any E2E test can run.**

- [x] T004 Add `emulators` block to `firebase.json` — Auth on port 9099, Firestore on port 8080, UI on port 4000 (enabled)
- [x] T005 [P] Create `.env.test.example` at project root with all six `VITE_FIREBASE_*` vars set to demo values and `VITE_USE_FIREBASE_EMULATOR=true` (see data-model.md for exact values)
- [x] T006 Add `.env.test` to `.gitignore` (project root)
- [x] T007 Update `src/services/firebase.ts` — when `import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'`: use `memoryLocalCache()` instead of `persistentLocalCache()`, call `connectFirestoreEmulator(db, 'localhost', 8080)`, and call `connectAuthEmulator(auth, 'http://localhost:9099')`
- [x] T008 Add `"build:test"` script to `package.json`: `"vue-tsc -b && vite build --mode test"`

**Checkpoint**: Running `npm run build:test` (with `.env.test` in place) produces a `dist/` built against demo emulator config. No real Firebase calls occur.

---

## Phase 3: User Story 1 — Test Infrastructure Bootstrap (Priority: P1) 🎯 MVP

**Goal**: A single `npm run test:e2e` command discovers and runs all Playwright tests, connects to the local Firebase emulators, resets their state, and exits cleanly with a green result (even with zero business tests).

**Independent Test**: Run `npm run test:e2e` with emulators running. The command should complete without errors — the `globalSetup` resets emulator state, creates the test user, and exits. Zero test failures is the pass criterion for this story alone.

### Implementation for User Story 1

- [x] T009 [US1] Create `playwright.config.ts` at project root — set `baseURL: 'http://localhost:4173'`, `globalSetup: './e2e/global-setup.ts'`, `webServer: { command: 'npm run build:test && vite preview', url: 'http://localhost:4173', reuseExistingServer: !process.env.CI }`, single project (Chromium), reporter: `[['html'], ['list']]`
- [x] T010 [US1] Add `"test:e2e"` script to `package.json`: `"playwright test"`
- [x] T011 [US1] Create `e2e/global-setup.ts` — (1) HTTP DELETE to `http://localhost:8080/emulator/v1/projects/demo-test/databases/(default)/documents` to clear Firestore, (2) HTTP DELETE to `http://localhost:9099/emulator/v1/projects/demo-test/accounts` to clear Auth, (3) HTTP POST to `http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key` with body `{ email: 'test@example.com', password: 'testpassword123', returnSecureToken: false }` to create test user — throw with a clear message on any non-200 response

**Checkpoint**: `npm run test:e2e` (with emulators running and `.env.test` in place) exits green. Emulator UI at `http://localhost:4000` shows the test user was created.

---

## Phase 4: User Story 2 — Add Exercise End-to-End Test (Priority: P2)

**Goal**: An automated test logs in as the test user, navigates to the exercise list, adds "Bench Press", asserts it appears in the list, reloads the page, and asserts it still persists.

**Independent Test**: `npx playwright test e2e/exercises/add-exercise.spec.ts` passes all scenarios with emulators running.

### Implementation for User Story 2

- [x] T012 [US2] Create `e2e/fixtures/auth.ts` — export `TEST_USER = { email: 'test@example.com', password: 'testpassword123' }` and export `async function signInAsTestUser(page: Page)` that calls `page.evaluate()` to invoke `signInWithEmailAndPassword` from the Firebase SDK bundle in the browser context using `TEST_USER` credentials, then waits for auth state to resolve (e.g., waits for redirect away from login page or for a known authenticated element)
- [x] T013 [US2] Inspect `src/components/exercises/` (and `src/views/ExercisesView.vue`) to identify stable selectors for: (a) the "add exercise" trigger button, (b) the exercise name input field, (c) the submit/confirm button, (d) the exercise list items — document findings as inline comments in the test file; add `data-testid` attributes to the relevant components if no stable selector exists
- [x] T014 [US2] Create `e2e/exercises/add-exercise.spec.ts` — `beforeEach`: call `signInAsTestUser(page)` then navigate to `/exercises`; **Test 1** "add exercise appears in list": open add-exercise dialog, type `Bench Press`, submit, assert `Bench Press` is visible in the list; **Test 2** "add exercise persists after reload": reload the page, assert `Bench Press` is still visible

**Checkpoint**: Both tests in `add-exercise.spec.ts` pass. Emulator Firestore UI shows the exercise document under the test user's collection.

---

## Phase 5: CI Workflow

**Goal**: The full test suite runs automatically on every push and PR via GitHub Actions.

- [x] T015 Create `.github/workflows/e2e.yml` — triggers on `push` and `pull_request` (all branches); steps: (1) `actions/checkout@v4`, (2) `actions/setup-node@v4` with Node 20, (3) `npm ci`, (4) `npx playwright install --with-deps chromium`, (5) `cp .env.test.example .env.test`, (6) `npx firebase emulators:exec --only auth,firestore "npm run test:e2e"` — upload `playwright-report/` as artifact on failure using `actions/upload-artifact@v4` with `if: failure()`

**Checkpoint**: Push a commit and verify the Actions tab shows a passing workflow run. PR status checks show the E2E test result.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T016 [P] Follow `quickstart.md` from scratch on a clean terminal (no `.env.test` present) and verify all steps work as documented — fix any discrepancies in `specs/005-e2e-test-setup/quickstart.md`
- [x] T017 [P] Verify Firestore security rules are loaded by the emulator — confirm `firebase.json` references `"firestore": { "rules": "firestore.rules" }` (existing key) so the emulator enforces per-user isolation during tests

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (T001–T003 complete)
- **Phase 3 (US1)**: Depends on Phase 2 complete — specifically T007 (firebase.ts), T008 (build:test script)
- **Phase 4 (US2)**: Depends on Phase 3 complete (globalSetup must work before business tests)
- **Phase 5 (CI)**: Can start after Phase 3 is complete; does not require Phase 4 to be done
- **Phase 6 (Polish)**: Depends on Phase 4 complete

### Within Phase 3

```
T009 (playwright.config) → T010 (npm script) → T011 (globalSetup)
All three can be written in parallel (different files), then verified together.
```

### Within Phase 4

```
T012 (auth fixture)  ─┐
T013 (selector audit) ─┤→ T014 (test file) — depends on T012 + T013
```

### Parallel Opportunities

```bash
# Phase 1 — T001 and T002 in parallel (different packages):
npm install -D @playwright/test
npm install -D firebase-tools

# Phase 2 — T004, T005, T006 in parallel (different files):
# Update firebase.json emulators block
# Create .env.test.example
# Update .gitignore

# Phase 3 — T009, T010, T011 in parallel (different files):
# Create playwright.config.ts
# Add test:e2e npm script
# Create e2e/global-setup.ts

# Phase 4 — T012 and T013 in parallel:
# Create e2e/fixtures/auth.ts
# Audit component selectors
```

---

## Implementation Strategy

### MVP (User Story 1 only — stop after Phase 3)

1. Phase 1: Install Playwright + firebase-tools
2. Phase 2: Update firebase.ts, create .env.test.example, add build:test script
3. Phase 3: Create playwright.config.ts, globalSetup, add test:e2e script
4. **STOP and VALIDATE**: `npm run test:e2e` exits green with no test files yet

### Full Delivery

1. Phases 1–3 (MVP foundation)
2. Phase 4: Add exercise test → passes locally
3. Phase 5: CI workflow → passes on GitHub Actions
4. Phase 6: Polish + quickstart verification

---

## Notes

- [P] tasks touch different files — safe to run concurrently
- T007 (`firebase.ts`) is the only production source file modified — keep the change minimal and guarded by the env var check
- If `page.evaluate()` in T012 cannot access the Firebase SDK (bundled as a module), fall back to the Firebase Auth REST API (`identitytoolkit.googleapis.com/v1/accounts:signInWithPassword`) to obtain an ID token and inject it into localStorage manually
- The emulators must be running before `npm run test:e2e` is invoked locally; `firebase emulators:exec` handles this automatically in CI
- Commit after each checkpoint — each checkpoint represents a working, independently verifiable state
