# Session Detail E2E Tests — Design Spec

**Date:** 2026-04-10

## Overview

Add Playwright end-to-end tests for the session detail page (`/exercises/:id`). The page has two modes: read-only (no today session) and edit mode (today session active). Tests cover the full user journey: viewing last session, starting a new session with pre-fill, editing sets, toggling BumpIt, saving, and deleting.

---

## Infrastructure Changes

### `src/services/firebase.ts`

Expose `setDoc` and `doc` on `window` in the emulator block, alongside the existing helpers (`addDoc`, `collection`, etc.). Sessions use `setDoc` with a date-string document ID (`YYYY-MM-DD`), so `addDoc` is not sufficient.

```ts
// additions inside the `if (useEmulator)` block
import { setDoc, doc } from 'firebase/firestore'
(window as ...).__e2eSetDoc = setDoc
(window as ...).__e2eDoc = doc
```

### `e2e/fixtures/sessions.ts` (new file)

Three helpers, mirroring the structure of `exercises.ts`:

- **`seedSession(page, exerciseId, dateStr, sets)`** — writes a session document to `users/{uid}/exercises/{exerciseId}/sessions/{dateStr}` via the emulator. Requires `signInAsTestUser` to have been called first.
- **`clearSessions(page, exerciseId)`** — deletes all session documents under the given exercise.
- **`navigateToExercise(page, exerciseId)`** — navigates to `/exercises/:id` and waits for the loading spinner to disappear.

---

## Test Files

All files live under `e2e/session/`. All use `test.describe.configure({ mode: 'serial' })`. Each `beforeAll` seeds a clean exercise (and session if needed). Each `beforeEach` calls `signInAsTestUser` and navigates to the exercise detail page.

### `session-read-only.spec.ts`

**Setup:** Seed one exercise + one past session (yesterday's date, 2 sets with known weight/reps).

| Test | What it checks |
|---|---|
| Last training date is shown | Text matching the formatted date appears |
| Last session sets are shown | Weight and reps values from the seeded session visible in the table |
| "Pump it!" button is visible | CTA present in read-only mode |

### `start-session.spec.ts`

**Setup:** Seed one exercise + one past session with known weight/reps.

| Test | What it checks |
|---|---|
| "Pump it!" enters edit mode | Set rows appear, FABs appear |
| Sets are pre-filled from last session | Weight and reps inputs show last session's values |
| Pre-fill persists after reload | After `page.reload()`, same values still shown |

### `edit-sets.spec.ts`

**Setup:** Seed one exercise, no prior session. Each test clicks "Pump it!" to enter edit mode before interacting with set rows.

| Test | What it checks |
|---|---|
| Add set FAB adds a row | Clicking `mdi-plus` FAB increases row count by 1 |
| Editing weight triggers save | After changing a weight value, "Saved" chip appears |
| Saved data persists after reload | Weight value still shown after `page.reload()` |

### `bump-it.spec.ts`

**Setup:** Seed one exercise, no prior session. Start a session via "Pump it!" first.

| Test | What it checks |
|---|---|
| Toggling BumpIt activates it | 🆙 button opacity increases (or `aria-pressed` / visual change) |
| BumpIt state persists after reload | After `page.reload()`, the toggled set still shows BumpIt active |

### `delete-session.spec.ts`

**Setup:** Seed one exercise + seed today's session directly via `seedSession`.

| Test | What it checks |
|---|---|
| Delete FAB is visible | Red delete FAB present on page load |
| Confirmation dialog appears | Clicking delete FAB opens "Delete today's session?" dialog |
| Confirming delete restores read-only mode | After "Delete" in dialog, set rows gone, "Pump it!" button visible |

---

## Selector Notes

- Set rows: `.set-row` (from `SetRow.vue` scoped class)
- Weight input: first `v-number-input` within a `.set-row` — use `nth(0)` within the row
- Reps input: second `v-number-input` within a `.set-row` — use `nth(1)` within the row
- Save status chip: `role=status` or text match `Saved` / `Saving…`
- Add set FAB: `role=button[name="add"]` or icon `mdi-plus` fixed button
- Delete FAB: `role=button` with `mdi-delete` icon (bottom-left)
- BumpIt button: button containing `🆙` within a `.set-row`

> **Note:** If `.set-row` is not stable enough as a selector (scoped styles may not expose the class in production builds), a `data-testid="set-row"` attribute may need to be added during implementation.

---

## Constraints

- All tests use the Firebase emulator — no production data touched.
- `seedSession` requires `signInAsTestUser` to be called first (same pattern as `seedExercise`).
- `clearSessions` is called in `beforeAll` for each suite to ensure clean state.
- The 2-second auto-save debounce means save-related tests must wait for the "Saved" chip rather than asserting immediately.
