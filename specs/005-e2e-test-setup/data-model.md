# Data Model: E2E Test Automation Setup

**Feature**: 005-e2e-test-setup  
**Date**: 2026-04-08

This feature is infrastructure, not a new data domain. The relevant "entities" are configuration shapes and fixture contracts.

---

## Environment Configuration

### `.env.test` (gitignored, not committed)

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_FIREBASE_API_KEY` | `fake-api-key` | Required by Firebase SDK init; value irrelevant for emulator |
| `VITE_FIREBASE_AUTH_DOMAIN` | `demo-test.firebaseapp.com` | Required by SDK; emulator intercepts |
| `VITE_FIREBASE_PROJECT_ID` | `demo-test` | Must match emulator project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `demo-test.appspot.com` | Unused but required by config shape |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `000000000000` | Unused but required by config shape |
| `VITE_FIREBASE_APP_ID` | `1:000000000000:web:000000000000` | Unused but required by config shape |
| `VITE_USE_FIREBASE_EMULATOR` | `true` | Triggers emulator connections + memory cache mode |

### `.env.test.example` (committed)

Committed version of the above with documentation comments, showing developers the required shape without real values.

---

## Test Fixture: Test User

| Field | Value | Notes |
|-------|-------|-------|
| `email` | `test@example.com` | Hardcoded in `e2e/fixtures/auth.ts` |
| `password` | `testpassword123` | Hardcoded in `e2e/fixtures/auth.ts` |
| `displayName` | `Test User` | Set during emulator user creation |

Created fresh in `globalSetup` after emulator reset. Emulator-only — no production access.

---

## Test Fixture: Seed Exercise (for assertion baseline)

No seed exercise is pre-loaded. The "add exercise" test creates its own exercise from a clean state, so the starting exercise list must be empty for the assertion to be unambiguous.

| Field | Value | Notes |
|-------|-------|-------|
| `name` | `Bench Press` | The exercise name the test will create |

---

## Emulator Port Configuration

| Service | Port | Config location |
|---------|------|-----------------|
| Firebase Auth Emulator | `9099` | `firebase.json` |
| Firestore Emulator | `8080` | `firebase.json` |
| Emulator UI | `4000` | `firebase.json` (optional, for local debugging) |

---

## Firebase Emulator Configuration Schema (`firebase.json` additions)

```json
{
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

---

## Source Code Changes Required

### `src/services/firebase.ts` — Emulator connection logic

When `import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'`:
- Use `memoryLocalCache()` instead of `persistentLocalCache()`
- Call `connectFirestoreEmulator(db, 'localhost', 8080)`
- Call `connectAuthEmulator(auth, 'http://localhost:9099')`

This is the only production source file that requires modification. All other changes are additive (new files in `e2e/`).
