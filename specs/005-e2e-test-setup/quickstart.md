# Quickstart: E2E Test Automation Setup

**Feature**: 005-e2e-test-setup  
**Date**: 2026-04-08

---

## First-Time Setup (< 10 minutes)

### Prerequisites

- Node.js 20+ and npm installed
- Java 11+ installed (required by Firebase Emulator Suite)
- Project dependencies installed: `npm ci`

### Step 1: Install Playwright browsers

```bash
npx playwright install --with-deps chromium
```

### Step 2: Verify Firebase CLI

`firebase-tools` is included as a project devDependency — no global install needed:

```bash
npx firebase --version   # should print a version number
```

### Step 3: Create `.env.test`

Copy the example file and leave all values as-is (they are demo values, not real credentials):

```bash
cp .env.test.example .env.test
```

### Step 4: Verify emulators start

```bash
npx firebase emulators:start --only auth,firestore
```

You should see the Emulator UI at `http://localhost:4000`. Press Ctrl+C to stop.

---

## Running Tests

### Option A: Single command (recommended)

Start the emulators and run all tests with one command:

```bash
npm run test:e2e
```

This command builds the app, starts the static server, and runs Playwright. You must have the Firebase emulators running separately first (see Option B below).

### Option B: Manual steps (for debugging)

Terminal 1 — start emulators:
```bash
npx firebase emulators:start --only auth,firestore
```

Terminal 2 — build and run tests:
```bash
npm run test:e2e
```

### Running a specific test file

```bash
npx playwright test e2e/exercises/add-exercise.spec.ts
```

### Running with a visible browser (headed mode)

```bash
npx playwright test --headed
```

### Viewing the HTML test report

```bash
npx playwright show-report
```

---

## CI (GitHub Actions)

Tests run automatically on every push and pull request. No configuration needed — the workflow file handles emulator startup, build, and test execution.

To view results: check the **Actions** tab in the GitHub repository. A Playwright HTML report is uploaded as an artifact on test failure.

---

## Troubleshooting

**"Emulator not reachable"**: Ensure `npx firebase emulators:start --only auth,firestore` is running before executing tests.

**"Java not found"**: Firebase Emulator requires Java 11+. Install from https://adoptium.net.

**Tests fail with auth errors**: The emulator may have stale state. Restart the emulators — the global setup will reset and re-seed on the next run.

**IndexedDB errors in browser console**: Confirm `VITE_USE_FIREBASE_EMULATOR=true` is set in `.env.test` and the app was built with `--mode test`.
