> [!CAUTION]
> The app is created with agentic coding. The human was not reviewing the code. 

# Weights and Reps

A lightweight personal training tracker built for speed and simplicity. Logs exercises, weights, sets, and reps with a clean, distraction-free interface designed for quick data entry mid-workout. Maintains a full historical record of your training sessions.

# Technologies

* Run on Firebase and uses Firestore for data storage
* HTML/TypeScript
* VueJS / Vuetify
* Sign in with Google

# Development

## E2E Tests

Tests use [Playwright](https://playwright.dev) against the [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite) — no production data is touched.

**Prerequisites**: Node.js 20+, Java 11+ (required by Firebase Emulator)

### First-time setup

```bash
npm ci
npx playwright install chromium
cp .env.test.example .env.test
```

### Running tests

Start the emulators and run the full suite with one command:

```bash
npx firebase emulators:exec --only auth,firestore --project demo-test "npm run test:e2e"
```

Or run emulators and tests separately:

```bash
# Terminal 1
npx firebase emulators:start --only auth,firestore

# Terminal 2
npm run test:e2e
```

To view the HTML report after a failed run:

```bash
npx playwright show-report
```

### CI

Tests run automatically on every push and pull request via GitHub Actions (`.github/workflows/e2e.yml`). The Playwright report is uploaded as an artifact on failure.
