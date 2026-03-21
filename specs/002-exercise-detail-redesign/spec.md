# Feature Specification: Exercise Detail Page Redesign

**Feature Branch**: `002-exercise-detail-redesign`
**Created**: 2026-03-21
**Status**: Draft
**Input**: User description: "I want to change how the exercise details page is working. If the user enters it, usually it should just show the date of the last session and the table with sets, weights and repetitions. Additionally, there should be a button 'Pump it!' which means the user starts doing the exercise and will enter new data. After the click, the new session with today's date should be created and the user can edit sets, weights and repetitions. His inputs are saved automatically. Additionally a button 'Delete' with confirmation should delete the current today session. If the user enters the page and there is a session already exists for today's date, the form is automatically in the edit mode."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Last Session in Read-Only Mode (Priority: P1)

A user navigates to an exercise detail page and sees the most recent past session — its date and a table of all sets with weights and repetitions. No editing is possible in this default view. This gives the user a quick reference for their previous performance.

**Why this priority**: This is the default landing state every time a user opens the page. Without this, users have no context before starting a new session.

**Independent Test**: Navigate to an exercise that has at least one historical session. The page shows the last session date and set data in a read-only table. Can be tested independently with seed data.

**Acceptance Scenarios**:

1. **Given** the user navigates to an exercise detail page and no session exists for today, **When** the page loads, **Then** the date of the most recent past session is displayed along with a table showing all sets (with weight and repetition count) from that session.
2. **Given** the exercise has no sessions at all, **When** the page loads, **Then** an appropriate empty state message is shown (e.g., "No sessions recorded yet") and the "Pump it!" button is still visible.
3. **Given** the user is in read-only view, **When** they try to interact with the set data, **Then** no editing is possible — data is displayed as static content.

---

### User Story 2 - Start a New Session with "Pump it!" (Priority: P1)

A user clicks the "Pump it!" button to start recording a new workout session for today. The page transitions to edit mode with today's date, and the user can add/modify sets with weights and repetitions. All changes are saved automatically as the user types or modifies values, with no explicit "Save" button required.

**Why this priority**: This is the core action of the feature — recording a new workout. Without this, the app provides no value for tracking current sessions.

**Independent Test**: Click "Pump it!", enter sets with weights and reps, then refresh the page — the entered data should persist. Delivers complete new-session recording value independently.

**Acceptance Scenarios**:

1. **Given** the user is in read-only view (no today's session) and a past session exists, **When** they click "Pump it!", **Then** a new session for today's date is created and the page transitions to edit mode with sets pre-filled from the most recent past session.
1a. **Given** the user is in read-only view and no past session exists, **When** they click "Pump it!", **Then** edit mode opens with 3 empty set rows.
2. **Given** the user is in edit mode after clicking "Pump it!", **When** they add a set with weight and repetitions, **Then** the data is saved automatically without requiring any explicit save action.
3. **Given** the user entered some set data, **When** they navigate away and return to the page, **Then** the data they entered is still present (confirming auto-save worked).
4. **Given** the user is in edit mode, **When** they modify an existing set's weight or repetition count, **Then** the change is saved automatically.

---

### User Story 3 - Auto-Enter Edit Mode for Today's Session (Priority: P2)

If the user opens an exercise detail page and a session for today's date already exists (e.g., they left and came back mid-workout), the page automatically enters edit mode so the user can continue adding or adjusting sets without extra clicks.

**Why this priority**: This improves workflow for users who return to a session mid-workout. It avoids confusion and reduces friction.

**Independent Test**: Create a session for today via "Pump it!", navigate away, return to the page — edit mode is active automatically. Independently testable after Story 2 is in place.

**Acceptance Scenarios**:

1. **Given** a session for today already exists, **When** the user navigates to the exercise detail page, **Then** the page loads directly in edit mode showing today's session data.
2. **Given** the page auto-entered edit mode for today's session, **When** the user adds or modifies a set, **Then** the change is auto-saved.

---

### User Story 4 - Delete Today's Session with Confirmation (Priority: P3)

While in edit mode for today's session, the user can delete the entire session using a "Delete" button. A confirmation prompt appears before deletion to prevent accidental data loss. After deletion, the page returns to read-only mode showing the previous session.

**Why this priority**: Deletion is a safety net but not core to daily use. Implemented after the core recording flow is stable.

**Independent Test**: Create a today session, click "Delete", confirm — session is gone and the page reverts to showing the last previous session. Independently testable.

**Acceptance Scenarios**:

1. **Given** the user is in edit mode for today's session, **When** they click the "Delete" button, **Then** a confirmation dialog is displayed asking the user to confirm deletion.
2. **Given** the confirmation dialog is shown, **When** the user confirms deletion, **Then** today's session is permanently deleted and the page returns to read-only mode showing the most recent past session.
3. **Given** the confirmation dialog is shown, **When** the user cancels, **Then** no data is deleted and the page remains in edit mode.
4. **Given** the user is in read-only mode (no today's session), **When** the page is displayed, **Then** the "Delete" button is not visible.

---

### Edge Cases

- What happens if the user clicks "Pump it!" while offline or connectivity is lost? The session creation attempt should fail gracefully with a user-visible error message.
- What if today's session has zero sets when the user tries to delete it? The delete flow works the same — confirmation is required and deletion removes the empty session.
- What if the user quickly edits and auto-save encounters an error? An error indicator is shown to the user without discarding their in-progress input.
- What if an exercise has never had any session? An empty state message is displayed alongside the "Pump it!" button so the user can start their first session.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The exercise detail page MUST display the date and set data (weight in kg and repetitions per set) of the most recent past session by default in read-only mode. Past sessions (any date other than today) are permanently read-only and cannot be edited.
- **FR-002**: The exercise detail page MUST display a "Pump it!" button when no session for today's date exists.
- **FR-003**: When the user clicks "Pump it!", the system MUST create a new session for today's date and transition the page to edit mode, pre-filled with the sets (weight and repetitions) from the most recent past session as a starting template. If no past session exists, the edit mode starts with 3 empty set rows.
- **FR-004**: In edit mode, the user MUST be able to add sets via a "+" button (appends a new empty row) and edit weight and repetition values inline. Rows left empty (no weight or reps entered) are automatically excluded from the saved session.
- **FR-005**: All changes made in edit mode MUST be saved automatically without requiring an explicit save action from the user.
- **FR-006**: If a session for today's date already exists when the user navigates to the page, the page MUST automatically enter edit mode for that session.
- **FR-007**: In edit mode for today's session, a "Delete" button MUST be visible and accessible.
- **FR-008**: When the user clicks "Delete", a confirmation prompt MUST appear before any data is removed.
- **FR-009**: Upon confirmed deletion, today's session MUST be permanently removed and the page MUST return to read-only mode showing the previous session (or an empty state if none exists).
- **FR-010**: The "Delete" button MUST NOT be visible when the user is in read-only mode (no today's session).
- **FR-011**: When an exercise has no past sessions and no today's session, the page MUST display an appropriate empty state message alongside the "Pump it!" button.

### Key Entities

- **Exercise**: A named workout movement (e.g., "Bench Press"). The detail page is scoped to one exercise.
- **Session**: A workout record tied to a specific exercise and calendar date. Each exercise can have at most one session per calendar day.
- **Set**: A single entry within a session representing one round of the exercise, containing a weight value in kilograms (numeric, decimals allowed) and a repetition count (positive integer). A session contains an ordered list of sets.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can start recording a new session in 1 click from the exercise detail page.
- **SC-002**: All set data entered by the user is persisted without any manual save action — 100% of edits survive a page refresh.
- **SC-003**: Users returning to an in-progress today's session reach edit mode in 0 additional clicks (automatic on page load).
- **SC-004**: 100% of deletion attempts require explicit confirmation before data is removed — no accidental deletions are possible.
- **SC-005**: The previous session's data is always visible before starting a new session, giving users a performance reference on every visit.

## Clarifications

### Session 2026-03-21

- Q: When "Pump it!" is clicked and no today's session exists, should edit mode start with last session's sets pre-filled or empty? → A: Pre-fill with last session's sets (weight + reps) as a starting template.
- Q: How does the user add a new set row in edit mode? → A: Existing "+" button appends a new empty row at the bottom of the table.
- Q: What unit should weight values be stored and displayed in? → A: Kilograms (kg), fixed unit.
- Q: Can users edit sessions from previous days, or is editing limited to today's session only? → A: Only today's session can be edited — all past sessions are permanently read-only.

## Assumptions

- A "session" is unique per exercise per calendar day — only one session per exercise per date is allowed.
- "Today" is determined by the user's local device date.
- Auto-save triggers on each individual field change (not on blur or on an explicit submit).
- The number of sets per session is not limited by the system.
- Weight values are numeric in kilograms (supporting decimals, e.g., 22.5 kg) and repetitions are positive integers. No unit conversion is required.
- The page is accessible only to authenticated users — no anonymous access.
- "Most recent past session" excludes today's session; today's data is only shown in edit mode.
