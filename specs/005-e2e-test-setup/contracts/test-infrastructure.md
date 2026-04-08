# Contract: E2E Test Infrastructure

**Feature**: 005-e2e-test-setup  
**Date**: 2026-04-08

This contract defines the stable interfaces that test code depends on and that implementation code must honour.

---

## Contract 1: Emulator Availability

Any component that invokes the test suite (locally or in CI) MUST ensure:

- Firebase Auth Emulator is reachable at `http://localhost:9099` before tests begin.
- Firebase Firestore Emulator is reachable at `http://localhost:8080` before tests begin.
- Both emulators are configured with project ID `demo-test`.

**Violation**: If either emulator is unreachable when tests start, the `globalSetup` script MUST throw an error with a clear message identifying which service is unavailable.

---

## Contract 2: Emulator Reset API

The globalSetup script MUST reset state by calling these endpoints before any test runs:

```
DELETE http://localhost:8080/emulator/v1/projects/demo-test/databases/(default)/documents
DELETE http://localhost:9099/emulator/v1/projects/demo-test/accounts
```

Expected response: HTTP 200. Any non-200 response MUST cause globalSetup to throw.

---

## Contract 3: Test User

After reset, the globalSetup script MUST create the test user via:

```
POST http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key
Body: { "email": "test@example.com", "password": "testpassword123", "returnSecureToken": false }
```

All tests that require authentication MUST use these exact credentials. Tests MUST NOT create additional users.

---

## Contract 4: App Build Environment

The production build used in tests MUST be built with `--mode test`, which loads `.env.test`. The built artifact MUST:

- Connect exclusively to `localhost` emulators (enforced by `VITE_USE_FIREBASE_EMULATOR=true`).
- Use memory-only Firestore cache (no IndexedDB).
- Be served on `http://localhost:4173` (Vite preview default port).

---

## Contract 5: CI Secrets

The CI workflow MUST NOT require any Firebase production credentials. The only required CI environment input is the contents of `.env.test`, which contains only demo values and carries no security sensitivity.

---

## Contract 6: Test Command Interface

The single command to run all tests locally (after emulators are started) MUST be:

```
npm run test:e2e
```

This command MUST: build the app in test mode, start the static server, run all Playwright tests, and exit with code 0 on success or non-zero on failure.
