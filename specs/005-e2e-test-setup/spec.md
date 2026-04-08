# Feature Specification: E2E Test Automation Setup

**Feature Branch**: `005-e2e-test-setup`  
**Created**: 2026-04-08  
**Status**: Draft  
**Input**: User description: "I want test automation for this project. Technologies to use: Firebase Emulator Suite + Playwright/Cypress. Let's start with the setup and a test that adds an exercise."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Test Infrastructure Bootstrap (Priority: P1)

A developer sets up the test automation infrastructure so that end-to-end tests can be run locally and automatically in CI (on every push/PR) without touching production data. The setup includes a local backend emulator, a browser automation framework, and a CI pipeline configuration.

**Why this priority**: Without this foundation, no automated tests can run. Everything else depends on it.

**Independent Test**: Can be fully tested by running the test suite bootstrapping command and confirming it launches, connects to a local backend, and exits cleanly — delivering a green baseline with zero tests skipped.

**Acceptance Scenarios**:

1. **Given** a freshly cloned repository, **When** the developer runs the test setup command, **Then** the required dependencies are installed and the test runner starts without errors.
2. **Given** the test environment is running, **When** the developer executes the full test suite, **Then** all test files are discovered and the results are reported (pass/fail/skip) in the terminal.
3. **Given** the test suite completes, **When** the developer inspects the output, **Then** no production database or authentication service has been contacted.

---

### User Story 2 - Add Exercise End-to-End Test (Priority: P2)

A developer writes and runs an automated test that simulates a logged-in user navigating to the exercise list and adding a new exercise. The test verifies the exercise appears in the list after submission.

**Why this priority**: This is the first meaningful business scenario to be validated automatically. It proves the test infrastructure works end-to-end and establishes a pattern for future tests.

**Independent Test**: Can be fully tested by running only this test file. A test user is created in the local emulator, the app is navigated via browser automation, and the exercise list is asserted to contain the new entry.

**Acceptance Scenarios**:

1. **Given** a test user account exists in the local emulator, **When** the test logs in and navigates to the exercise list, **Then** the exercise list page is displayed.
2. **Given** the exercise list is displayed, **When** the test submits a new exercise with a valid name, **Then** the exercise appears in the list without a page refresh.
3. **Given** a new exercise was added, **When** the test reloads the exercise list page, **Then** the exercise is still present (persisted in the local emulator).
4. **Given** the test completes, **When** the next test run starts, **Then** the local emulator data is reset so tests are isolated and repeatable.

---

### Edge Cases

- What happens when the local emulator is not running when tests start — does the test suite fail fast with a clear error message?
- How does the system handle a test that tries to add an exercise with an empty or duplicate name?
- What happens when the app under test is slow to load and elements are not immediately available?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The test environment MUST run entirely against a local backend emulator with no network calls to production services.
- **FR-002**: The test suite MUST be executable with a single command from the project root.
- **FR-003**: The emulator MUST be reset to a clean, known baseline state once at the start of each test run (suite-level). Individual tests within a run share state and must be written accordingly.
- **FR-004**: The "add exercise" test MUST authenticate as a test user, navigate the app UI, submit the exercise form, and assert the exercise appears in the list.
- **FR-005**: The "add exercise" test MUST also verify the exercise persists across a page reload.
- **FR-006**: Test results MUST be reported in a human-readable format in the terminal.
- **FR-007**: The test setup MUST include instructions (or a script) for first-time configuration so any developer on the team can onboard without manual research.
- **FR-008**: A CI pipeline configuration MUST run the full test suite automatically on every push and pull request.
- **FR-009**: The CI pipeline MUST install the emulator and browser automation dependencies as part of its setup steps, requiring no pre-installed state on the CI runner.
- **FR-010**: Tests MUST run against a production build of the app (not a dev server), served by a static file server pointed at the local emulator.

### Key Entities

- **Test User**: A pre-seeded account in the local emulator used by tests; credentials (email + password) are hardcoded in test fixture files — acceptable since these are emulator-only values with no production access.
- **Exercise**: A named item a user creates; key attribute is its display name; must appear in the exercise list after creation.
- **Emulator State**: The local backend's data snapshot; reset to a baseline before each test run (or each test, depending on configuration).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer with a freshly cloned repository can run the test suite successfully within 10 minutes of following the setup instructions.
- **SC-002**: The "add exercise" test completes (login → add → assert) in under 30 seconds on a standard development machine.
- **SC-003**: 100% of tests pass on a clean checkout with no manual data setup steps required.
- **SC-004**: Zero production data sources are contacted during any test run — verified by inspecting network traffic logs.
- **SC-005**: Test runs are fully repeatable: running the suite twice in a row produces identical results.
- **SC-006**: The CI pipeline executes the full test suite on every push without manual intervention, and results are visible in the pull request status checks.

## Assumptions

- The app is built (`npm run build`) and served statically during tests — both locally and in CI. Tests run against the production artifact, not the dev server.
- A single test user (fixed credentials) is sufficient for this initial scope.
- Tests will run headlessly in CI and with a visible browser locally for debugging.
- Data isolation is achieved by resetting the emulator state once before the entire test run (suite-level reset). Individual tests are not isolated from each other — tests should be written to accommodate this.
- Playwright is the browser automation tool for this project (chosen for its native TypeScript support, headless CI capability, and strong async handling for SPAs).

## Clarifications

### Session 2026-04-08

- Q: How should test user credentials be stored and referenced? → A: Hardcoded in test fixtures (acceptable since emulator-only credentials carry no real security risk).
- Q: Should CI pipeline integration be in scope for this feature? → A: Yes — a CI workflow that runs tests automatically on every push/PR is in scope.
- Q: Which browser automation tool should the tests use? → A: Playwright.
- Q: How should the app be served during tests? → A: Production build (`npm run build`) served statically — tests run against the built artifact, not the dev server.
- Q: When should emulator state be reset? → A: Once before the entire test run (suite-level reset), not per individual test.
