# Research: E2E Test Automation Setup

**Feature**: 005-e2e-test-setup  
**Date**: 2026-04-08

---

## Decision 1: Authentication Strategy for Tests

**Decision**: Use Firebase Auth Emulator with email/password sign-in, bypassing the Google OAuth popup via `page.evaluate()`.

**Rationale**: The production app uses Google OAuth via `signInWithPopup`, which cannot be automated by any browser automation tool (popup window leaves Playwright's control). The Firebase Auth Emulator supports creating email/password users via its Admin REST API. Playwright can then call `signInWithEmailAndPassword()` from the Firebase SDK in the browser context using `page.evaluate()` — no UI login flow required, no changes to the login page needed.

**Alternatives considered**:
- Modifying the app to add an email/password login form (rejected: adds production code complexity for test-only purposes).
- Mocking Firebase Auth at the network layer (rejected: too brittle, breaks with SDK changes).
- Using Firebase's `signInWithCustomToken` via Admin SDK token exchange (valid but more complex than email/password for this use case).

---

## Decision 2: Firestore Cache Mode for Tests

**Decision**: Introduce a `VITE_USE_FIREBASE_EMULATOR` environment variable. When set to `true`, the Firebase service module uses `memoryLocalCache()` instead of `persistentLocalCache()`, and connects to the local emulator.

**Rationale**: `persistentLocalCache()` relies on IndexedDB, which is unreliable in headless Chromium (Playwright's default). It can cause stale data reads across test runs and initialization failures. `memoryLocalCache()` is ephemeral and deterministic — correct for tests. The same env var also triggers `connectFirestoreEmulator()` and `connectAuthEmulator()` calls.

**Alternatives considered**:
- Separate `firebase-test.ts` entry point (rejected: duplicates initialization logic, harder to maintain).
- Disabling persistence via a build-time constant (valid approach, but env var is more flexible and CI-friendly).

---

## Decision 3: App Serving Strategy

**Decision**: Build the app with `npm run build -- --mode test` (using a `.env.test` file), then serve `dist/` using `vite preview` via Playwright's `webServer` config.

**Rationale**: Tests run against the production artifact (per spec clarification). `vite preview` is already available as part of the `vite` devDependency — no additional static server package needed. Playwright's `webServer` option starts and stops the server automatically around the test run.

**Alternatives considered**:
- `serve` or `http-server` npm packages (rejected: extra dependency when `vite preview` is already available).
- Dev server (`npm run dev`) — rejected per spec clarification that tests run against production build.

---

## Decision 4: Emulator Reset Strategy

**Decision**: Reset Auth and Firestore emulator state via HTTP DELETE requests to the emulator REST API at the start of the Playwright global setup, before any tests run.

**Endpoints**:
- Firestore: `DELETE http://localhost:8080/emulator/v1/projects/demo-test/databases/(default)/documents`
- Auth: `DELETE http://localhost:9099/emulator/v1/projects/demo-test/accounts`

**Rationale**: The Firebase Emulator exposes these endpoints specifically for test lifecycle management. Using them in Playwright's `globalSetup` ensures a clean slate before each run. No Admin SDK package required — plain `fetch` calls suffice.

**Alternatives considered**:
- `firebase-admin` SDK for teardown (valid but adds a dependency; REST API is simpler for this scope).
- Per-test emulator restart (rejected per spec: suite-level reset only).

---

## Decision 5: CI Pipeline

**Decision**: GitHub Actions workflow using `firebase-tools` (installed via npm) to start emulators, then Playwright's built-in CI mode for test execution.

**Workflow steps**:
1. Checkout, set up Node.js
2. `npm ci`
3. `npx playwright install --with-deps chromium` (installs Chromium only — faster CI)
4. `npx firebase emulators:exec` to start emulators, run tests, and shut down automatically
5. Upload Playwright HTML report as a CI artifact on failure

**Rationale**: `firebase emulators:exec` is the canonical way to start emulators for a single command and then exit — it wraps the command, starts emulators, runs it, and exits. This is cleaner than starting emulators in the background and manually killing them.

**Alternatives considered**:
- Starting emulators as a background service step (rejected: requires manual process management, error-prone in CI).
- Using the Firebase Emulator Hub for programmatic control (overkill for this scope).

---

## Decision 6: Test User Credentials

**Decision**: Hardcode a fixed test user in the Playwright global setup fixture:
- Email: `test@example.com`
- Password: `testpassword123`
- These are created fresh each run after the emulator reset.

**Rationale**: Per spec clarification, credentials are hardcoded in test fixtures. Since these only work against the local emulator (never production), there is no security risk.

---

## Decision 7: Firebase Project ID for Emulator

**Decision**: Use `demo-test` as the Firebase project ID for emulator runs.

**Rationale**: The Firebase Emulator requires a project ID. IDs starting with `demo-` are treated as demo projects by the Firebase CLI — they never make network calls to real Firebase infrastructure, even if credentials are present. This enforces the no-production-contact requirement at the tooling level.

---

## Resolved Unknowns Summary

| Unknown | Resolution |
|---------|------------|
| Auth strategy (no Google OAuth in tests) | Email/password via emulator, programmatic sign-in |
| IndexedDB in headless browsers | `memoryLocalCache()` when `VITE_USE_FIREBASE_EMULATOR=true` |
| App serving during tests | `vite preview` via Playwright `webServer` |
| Emulator reset mechanism | HTTP DELETE to emulator REST endpoints in `globalSetup` |
| CI emulator lifecycle | `firebase emulators:exec` wraps the test command |
| Test project ID | `demo-test` (demo prefix prevents real Firebase calls) |
