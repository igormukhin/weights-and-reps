# Feature Specification: Exercise List Edit Mode

**Feature Branch**: `004-exercise-edit-mode`  
**Created**: 2026-04-08  
**Status**: Draft  
**Input**: User description: "I want to make exercise overview page cleaner - remove all rarely used buttons (add/edit/remove exercise) and show them only in the edit mode. To get to the edit mode, we need a new button."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clean Browse Mode (Priority: P1)

A user opens the exercise list to quickly find and tap into an exercise to start their workout. The page is uncluttered — no action buttons are visible, just the exercise names. There is no drag handle visible. An "Edit" button is available in the app bar to switch to edit mode if needed.

**Why this priority**: This is the primary use case — users visit the exercise list many times per day to start a workout session. A clean list improves daily usability and reduces visual noise.

**Independent Test**: Can be fully tested by loading the exercise list and verifying that only exercise names and the Edit button in the app bar are visible, delivering a cleaner browsing experience.

**Acceptance Scenarios**:

1. **Given** the user is on the exercise list page, **When** the page loads in default (browse) mode, **Then** no add, edit, rename, or remove buttons are visible — only exercise names and the Edit toggle in the app bar
2. **Given** browse mode is active, **When** the user taps an exercise name, **Then** they navigate to the exercise detail page as normal
3. **Given** browse mode is active, **When** the user views the app bar, **Then** an "Edit" button is visible (in addition to the existing sign-out button)

---

### User Story 2 - Enter and Use Edit Mode (Priority: P2)

A user wants to add a new exercise, rename an existing one, or remove one they no longer use. They tap the "Edit" button in the app bar, the list transitions to edit mode, and all management controls become visible: per-exercise rename and remove buttons, drag handles for reordering, and the add (+) button.

**Why this priority**: Management actions are infrequent (initial setup, occasional maintenance) and should be accessible but not always visible.

**Independent Test**: Can be fully tested by tapping Edit, verifying all management controls appear, and performing add/rename/remove/reorder actions successfully.

**Acceptance Scenarios**:

1. **Given** browse mode is active, **When** the user taps the "Edit" button in the app bar, **Then** the list transitions to edit mode: drag handles, per-exercise rename and remove buttons, and the add (+) button all become visible, the button label changes to "Done", and the app bar title changes to "Edit Exercises"
2. **Given** edit mode is active, **When** the user taps "Done", **Then** the list returns to browse mode, all management controls are hidden, the button label reverts to "Edit", and the app bar title reverts to "Weights & Reps"
3. **Given** edit mode is active, **When** the user drags an exercise to reorder it, **Then** the new order is saved
4. **Given** edit mode is active, **When** the user taps the add (+) button, **Then** the add exercise dialog opens
5. **Given** edit mode is active, **When** the user taps the rename (pencil) button on an exercise, **Then** the rename dialog opens
6. **Given** edit mode is active, **When** the user taps the remove/hide button on an exercise, **Then** the remove/hide dialog opens
7. **Given** edit mode is active, **When** the user taps an exercise name, **Then** nothing happens — navigation to the detail page is disabled

---

### Edge Cases

- What happens when the user navigates away while in edit mode? — Edit mode resets to browse mode on re-entry.
- What happens if there are no exercises in browse mode? — The empty state message guides users to tap Edit to add their first exercise.
- What happens if there are no exercises in edit mode? — The add (+) button is shown so the user can add their first exercise.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST default the exercise list page to browse mode on every visit
- **FR-002**: Browse mode MUST hide all exercise management controls: add button, per-exercise rename buttons, per-exercise remove/hide buttons, and drag handles
- **FR-003**: The app bar MUST display an "Edit" toggle button that switches between browse and edit mode
- **FR-004**: Edit mode MUST reveal all management controls: add (+) button, per-exercise rename (pencil) button, per-exercise remove/hide (eye-off) button, and drag handles
- **FR-005**: Tapping "Done" or the edit toggle a second time MUST return the list to browse mode, hiding all management controls
- **FR-006**: Navigating away from and back to the exercise list page MUST reset the view to browse mode
- **FR-007**: All existing management actions (add, rename, remove/hide, reorder) MUST continue to function correctly when triggered from edit mode
- **FR-009**: In edit mode, tapping an exercise name MUST NOT navigate to the exercise detail page; only the explicit action buttons (rename, remove) are interactive per row
- **FR-010**: When edit mode is active, the app bar title MUST change to "Edit Exercises"; when browse mode is restored, the title MUST revert to "Weights & Reps"
- **FR-008**: The empty-state message MUST guide users to tap "Edit" to add their first exercise (since the add button is hidden in browse mode)

### Key Entities

- **Browse Mode**: Default state of the exercise list; shows only exercise names and the Edit toggle; no management controls visible
- **Edit Mode**: Activated state; reveals add button, per-exercise rename and remove buttons, and drag handles for reordering

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open the exercise list and navigate to any exercise in one tap — no management buttons obstruct the view
- **SC-002**: Users can enter edit mode, perform a management action (add/rename/remove/reorder), and return to browse mode in under 10 seconds
- **SC-003**: 100% of existing management actions (add, rename, remove/hide, reorder) remain accessible and functional in edit mode
- **SC-004**: The exercise list page in browse mode contains no more interactive controls per exercise than the exercise name itself

## Clarifications

### Session 2026-04-08

- Q: When the user taps an exercise name while in edit mode, does it navigate to the detail page or is navigation disabled? → A: Navigation is disabled in edit mode — tapping an exercise name does nothing.
- Q: Beyond the "Edit"→"Done" button label change, is there an additional visual indicator for edit mode? → A: Yes — the app bar title also changes (e.g., "Weights & Reps" → "Edit Exercises").

## Assumptions

- The drag-to-reorder functionality (drag handle) is treated as a management action and is therefore hidden in browse mode.
- The "Edit" button label changes to "Done" when edit mode is active, providing clear affordance to exit. The app bar title simultaneously changes to "Edit Exercises" as an additional visual indicator.
- Edit mode is session-scoped: navigating away always resets to browse mode (no persistence of edit-mode state).
- The existing empty-state message ("Tap + to add your first exercise") will be updated to guide users to the Edit button instead, since the + FAB is hidden in browse mode.
