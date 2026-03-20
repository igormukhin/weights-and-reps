# Feature Specification: Weights and Reps — Training Tracker App

**Feature Branch**: `001-training-tracker-app`
**Created**: 2026-03-20
**Status**: Draft
**Input**: Build on application as described in README.md

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Log a Workout Session (Priority: P1)

A user opens the app during a training session and quickly logs the weights and reps
for each set of an exercise. The interface prefills sensible defaults from the previous
session to minimise typing, and data is saved automatically so nothing is lost if the
user switches apps or the phone locks.

**Why this priority**: This is the sole reason the app exists. Without the ability to
quickly log a set, the app has no value. Everything else is secondary.

**Independent Test**: Can be fully tested by opening an existing exercise, entering
weight and rep values across multiple sets, and confirming the data persists after
navigating away and returning to the screen — without any other feature being
implemented.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the exercises screen, **When** they tap an exercise,
   **Then** the exercise detail screen opens showing one row per set, each with last
   weight, last reps (read-only), new weight and new reps (editable) fields.

2. **Given** an open exercise detail screen with no data logged today, **When** the
   screen loads, **Then** the "new" fields are empty and the "last" fields show values
   from the most recent previous training session.

3. **Given** an open exercise detail screen with data already logged today, **When**
   the screen loads, **Then** the "new" fields are pre-populated with today's already-
   logged values, and the "last" fields show the previous session's values.

4. **Given** a user taps an empty "new weight" field, **When** it was the first set,
   **Then** the field is focused for manual input; **When** it was a subsequent set,
   **Then** the field is filled with the last weight from the set immediately above it.

5. **Given** a user taps an empty "new reps" field on any set, **When** it was not
   the first set, **Then** the field is filled with the reps value from the set
   immediately above it.

6. **Given** a user changes any editable field, **When** 2 seconds pass with no
   further changes, **Then** the data is saved automatically without requiring manual
   confirmation.

7. **Given** a user taps the weight increment arrow on a set, **When** tapped,
   **Then** the weight increases by exactly 2.5 kg; when the decrement arrow is
   tapped, the weight decreases by exactly 2.5 kg.

8. **Given** a user taps the reps increment/decrement arrows, **When** tapped,
   **Then** the reps value changes by exactly 1.

9. **Given** a user needs more than the default sets, **When** they tap "add set",
   **Then** a new set row is appended and available for input.

---

### User Story 2 - Manage the Exercise List (Priority: P2)

A user can add new exercises, correct the name of an existing one, and hide exercises
they no longer do — all from the main exercises screen. Hidden exercises disappear from
the list but their historical data is preserved.

**Why this priority**: The exercise list is the gateway to logging. Users need to be
able to set it up and keep it tidy. However, once a few exercises exist, training can
proceed without further list management, which is why it ranks below logging.

**Independent Test**: Can be fully tested by creating a new exercise, renaming it,
and then hiding it — confirming that the list reflects changes and that the hidden
exercise no longer appears, without needing the workout-logging feature to be
functional.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the exercises screen, **When** they initiate adding
   a new exercise and enter a name not already in the list (case-insensitive),
   **Then** the exercise is added and appears in the list.

2. **Given** a user tries to add an exercise with a name that already exists
   (case-insensitive), **When** they confirm, **Then** the system rejects the action
   and informs the user the name is already taken.

3. **Given** a user edits an existing exercise name and enters a name that is already
   taken (case-insensitive, including its own current name with different casing),
   **When** they confirm, **Then** the rename is rejected and the user is informed.

4. **Given** a user initiates hiding an exercise, **When** they confirm the action,
   **Then** the exercise is no longer shown in the list; its historical training data
   is retained and not deleted.

5. **Given** a user initiates hiding an exercise, **When** they cancel the
   confirmation dialog, **Then** the exercise remains in the list unchanged.

---

### User Story 3 - View Last Session Reference While Training (Priority: P3)

While logging a new session, the user can see the weights and reps they used in their
previous training session for the same exercise, without leaving the screen. This
serves as a reference target to aim for or beat.

**Why this priority**: The "last" fields are essential context that makes the app
meaningfully better than pen and paper, but they are read-only reference data — a
user can still log today's session without them, which is why logging (P1) takes
precedence.

**Independent Test**: Can be tested by logging a session on day 1, then re-opening
the exercise on day 2 and confirming the day-1 values appear in the "last" fields
alongside the empty "new" fields.

**Acceptance Scenarios**:

1. **Given** a user opens an exercise that has at least one prior session logged,
   **When** the detail screen opens, **Then** the "last weight" and "last reps"
   columns show values from the most recently completed session (not today).

2. **Given** a user opens an exercise that has never been logged, **When** the detail
   screen opens, **Then** the "last weight" and "last reps" columns are empty.

3. **Given** an exercise detail screen is open, **When** the user views the header,
   **Then** the date of the last training session is displayed in DD.MM.YYYY format.

---

### User Story 4 - Secure Personal Data Access (Priority: P4)

A user signs in with their Google account to access their personal training data.
Their data is private; no other user can see or modify it.

**Why this priority**: Authentication is a prerequisite for all other stories in a
multi-user context, but from a UX specification perspective it is foundational
infrastructure rather than a core user scenario. It ranks lowest because from the
user's perspective the sign-in flow is a one-time setup step.

**Independent Test**: Can be tested by signing in with two different Google accounts
and confirming that each account sees only its own exercises and training history.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user opens the app, **When** the app loads,
   **Then** the user is prompted to sign in before any data is accessible.

2. **Given** a user completes Google sign-in, **When** authenticated, **Then** they
   are taken directly to their exercises screen.

3. **Given** two users with separate accounts, **When** each views their exercises
   screen, **Then** each sees only their own exercises and no data from the other
   account is visible.

---

### Edge Cases

- What happens when the device loses connectivity mid-session? The user MUST be
  informed if a save fails; unsaved changes MUST not be silently discarded.
- What happens if a user accidentally hides an exercise? Hiding is permanent from
  a UI perspective — the exercise cannot be restored in-app. The confirmation dialog
  MUST clearly communicate this irreversibility.
- What happens when a user adds a set and then navigates away without entering data?
  Empty set rows MUST NOT create empty records in storage.
- What happens if the user enters 0 or a negative value for weight or reps?
  The system MUST prevent saving non-positive values (minimum 0.5 kg for weight,
  minimum 1 rep for reps).
- What happens when the exercise list is empty (new user)? The screen MUST show a
  clear prompt to add the first exercise.
- What happens when the previous session had more sets than the current template?
  The "last" fields MUST display all available previous sets; the user can add
  matching set rows as needed.

## Requirements *(mandatory)*

### Functional Requirements

**Exercises Screen**

- **FR-001**: System MUST display all non-hidden exercises belonging to the
  authenticated user in a scrollable list, ordered by the user's manually defined
  position.
- **FR-001a**: Users MUST be able to reorder exercises by dragging them to a new
  position; the new order MUST persist across sessions.
- **FR-001b**: When a new exercise is added, the system MUST insert it immediately
  after the exercise whose name shares the longest case-insensitive prefix with the
  new name. If no prefix match exists (or the list is empty), the new exercise MUST
  be appended at the end.
- **FR-002**: System MUST allow users to add a new exercise by providing a name;
  the name MUST be unique across the user's exercise list (case-insensitive).
- **FR-003**: System MUST allow users to rename an existing exercise. The new name
  MUST be unique among other exercises (case-insensitive comparison). A
  capitalisation-only change to the same exercise's own name (e.g., "bench press"
  → "Bench Press") MUST be accepted as a valid cosmetic update.
- **FR-004**: System MUST require explicit user confirmation before hiding an
  exercise.
- **FR-005**: System MUST soft-delete hidden exercises (mark as hidden) without
  removing historical training data; hidden exercises MUST NOT appear in the list
  and MUST NOT be restorable from within the app.
- **FR-006**: Tapping an exercise in the list MUST navigate the user to that
  exercise's detail screen.

**Exercise Detail Screen**

- **FR-007**: System MUST display the exercise name and the date of the last training
  session (DD.MM.YYYY) in the screen header.
- **FR-008**: System MUST display one set row per set, each showing: set number,
  last weight (read-only), last reps (read-only), new weight (editable), new reps
  (editable). The initial number of rows MUST match the set count from the most
  recent prior session; if no prior session exists, 3 rows MUST be shown by default.
- **FR-009**: On screen open, if the user has logged data for the current calendar
  day, that data MUST be loaded into the "new" fields.
- **FR-010**: On screen open, the most recent prior session's data MUST be loaded
  into the "last" (read-only) fields.
- **FR-011**: Tapping an empty "new weight" field on a set other than the first MUST
  auto-fill it with the "new weight" value of the immediately preceding set row.
- **FR-012**: Tapping an empty "new reps" field on a set other than the first MUST
  auto-fill it with the "new reps" value of the immediately preceding set row.
- **FR-013**: Each "new weight" field MUST have increment and decrement controls with
  a fixed step of 2.5 kg.
- **FR-014**: Each "new reps" field MUST have increment and decrement controls with
  a fixed step of 1 rep.
- **FR-015**: System MUST automatically save all changes within 2 seconds of the
  last user input, without requiring manual save action.
- **FR-016**: System MUST surface a visible error to the user if an auto-save fails.
- **FR-017**: Users MUST be able to add additional set rows beyond the default.
- **FR-018**: System MUST prevent saving a weight value less than 0.5 kg or a reps
  value less than 1.

**Authentication**

- **FR-019**: System MUST require authentication before any personal data is
  accessible.
- **FR-020**: System MUST support sign-in via Google account.
- **FR-021**: System MUST ensure each user can only access their own exercises and
  training records.

### Key Entities

- **User**: An authenticated account. Has a unique identity. Owns all exercises and
  training sessions associated with it.
- **Exercise**: A named movement (e.g., "Bench Press") belonging to a user. Has a
  name (unique per user, case-insensitive), a hidden flag, and a position value that
  determines its order in the user's exercise list. Can have many training sessions.
- **Training Session**: A collection of sets logged for a specific exercise on a
  specific calendar date. Belongs to one exercise and one user.
- **Set**: A single entry within a training session recording weight (kg) and reps
  performed. Has a position/order within the session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can open an exercise and log a complete set of data (weight and
  reps for all sets) within 30 seconds, starting from the exercises screen.
- **SC-002**: Data entered during a session is retrievable on next app open with 100%
  fidelity — no silent data loss.
- **SC-003**: The exercises screen loads and is interactive within 2 seconds on a
  standard mobile connection.
- **SC-004**: Users can add a new exercise and log their first session in a new
  account within 2 minutes of first sign-in.
- **SC-005**: Previous session reference data (last weight, last reps) is always
  visible alongside new input fields — zero additional taps required to reveal it.

## Clarifications

### Session 2026-03-20

- Q: Can hidden exercises be revealed and restored from within the app? → A: No. Hidden exercises are permanently inaccessible from the UI. They are soft-deleted in storage for data-integrity purposes only; there is no in-app unhide path.
- Q: In what order are exercises displayed on the exercises screen? → A: Manual order (user can drag to reorder). When a new exercise is added, it is inserted immediately after the exercise with the longest matching prefix (e.g., adding "Bench Press Incline" inserts it after "Bench Press" if that exists); if no prefix match, appended at the end.
- Q: How many set rows are shown by default when opening an exercise detail screen? → A: Match the previous session's set count. If no prior session exists, default to 3 rows.
- Q: How should the app behave when the same user has it open on two devices simultaneously and both save to the same session? → A: Out of scope. Simultaneous multi-device use is not a supported scenario.
- Q: Should renaming an exercise to the same letters with different capitalisation (e.g., "bench press" → "Bench Press") be allowed or rejected as a duplicate? → A: Allowed. A capitalisation-only rename is a valid cosmetic update and MUST succeed.

## Assumptions

- The app is intended for a single user per account; no shared or team workout
  functionality is in scope.
- Simultaneous multi-device use (e.g., phone and tablet editing the same session
  concurrently) is not a supported scenario and is explicitly out of scope.
- The initial number of set rows on the exercise detail screen matches the previous
  session's set count. For exercises with no history, 3 rows are shown by default.
- Weight is always in kilograms; no unit conversion or toggling between kg/lbs is
  required.
- Dates are displayed in German format (DD.MM.YYYY) throughout the app.
- There is no requirement to display or export historical charts or statistics;
  history is shown only as "last session" reference values within the detail screen.
