# Feature Specification: BumpIt Set Label

**Feature Branch**: `003-set-bump-label`
**Created**: 2026-03-22
**Status**: Draft
**Input**: User description: "We need to have an option to add or remove label to any single set. The first label we should implement is the so called BumpIt and can be displayed as an Up emoji 🆙. On the last session display if a set is labeled with BumpIt the emoji should be displayed in a column right to the weight. On the edit session display there should be a untitled column between weight and reps, where the user sees semi-transparent Up emoji and if he taps on it, the icon becomes fully visible and the set is marked with the label."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Toggle BumpIt Label While Editing a Session (Priority: P1)

A user is actively editing their workout session (adding/modifying sets). For each set row, there is an unlabeled column between the weight and reps fields showing a semi-transparent 🆙 emoji. The user taps the emoji to mark that set as "BumpIt", making the emoji fully opaque/visible. Tapping it again removes the label, making it semi-transparent again.

**Why this priority**: This is the core interaction — without the ability to apply the label, no other part of the feature has value.

**Independent Test**: Can be tested by opening an active session edit view, observing the semi-transparent emoji column, tapping it on any set, and verifying the emoji becomes fully visible. The label state should persist when the session is saved.

**Acceptance Scenarios**:

1. **Given** a session is open in edit mode with at least one set, **When** the user views a set row, **Then** a 🆙 emoji column is visible between the weight and reps inputs, displayed semi-transparently.
2. **Given** a set without the BumpIt label, **When** the user taps the 🆙 emoji, **Then** the emoji becomes fully visible and the set is marked with the BumpIt label.
3. **Given** a set already marked with BumpIt, **When** the user taps the 🆙 emoji, **Then** the emoji returns to semi-transparent and the BumpIt label is removed from the set.
4. **Given** a session with some sets labeled BumpIt, **When** the user saves/exits the session, **Then** the BumpIt labels persist correctly for each set.

---

### User Story 2 - View BumpIt Labels on Last Session Display (Priority: P2)

When a user views a read-only summary of their last session, sets that were marked with BumpIt show the 🆙 emoji in a dedicated column to the right of the weight value.

**Why this priority**: Displaying the label is the payoff for having marked it — users need to see the result of their annotation on the session summary view.

**Independent Test**: Can be tested by viewing the read-only last session display for a session where at least one set was previously marked BumpIt, verifying the 🆙 emoji appears in the correct column for labeled sets and does not appear for unlabeled sets.

**Acceptance Scenarios**:

1. **Given** a session where one or more sets have the BumpIt label, **When** the user views the last session display, **Then** the 🆙 emoji is shown in a column to the right of the weight for each labeled set.
2. **Given** a session where some sets have BumpIt and others do not, **When** the user views the last session display, **Then** only the labeled sets show the 🆙 emoji; unlabeled sets show nothing in that column.
3. **Given** a session where no sets have the BumpIt label, **When** the user views the last session display, **Then** no 🆙 emoji is shown for any set row.

---

### Edge Cases

- What happens when a set is added manually to a session? (Defaults to `bumpIt: false` — semi-transparent emoji in edit mode.)
- How does the display behave if the session has only one set and it is labeled? (Single set with emoji column should render consistently.)
- What happens if a user deletes a set that had the BumpIt label? (Label data should be discarded along with the set.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each set MUST support an optional BumpIt label that can be independently toggled on or off.
- **FR-002**: In the session edit view, each set row MUST display a 🆙 emoji column positioned between the weight and reps fields.
- **FR-003**: In the session edit view, the 🆙 emoji MUST appear semi-transparent when the BumpIt label is not applied to that set.
- **FR-004**: In the session edit view, the 🆙 emoji MUST appear fully visible/opaque when the BumpIt label is applied to that set.
- **FR-005**: Users MUST be able to toggle the BumpIt label on a set by tapping the 🆙 emoji in the edit view.
- **FR-006**: The BumpIt label column in the edit view MUST have no visible heading or title text.
- **FR-007**: In the last session (read-only) display, a 🆙 emoji column MUST always be rendered to the right of the weight column, regardless of whether any sets have the BumpIt label.
- **FR-008**: In the last session display, the 🆙 emoji MUST be shown for sets with `bumpIt: true`; sets with `bumpIt: false` MUST show an empty cell in that column.
- **FR-009**: BumpIt label state for each set MUST be persisted as part of the session data.
- **FR-010**: When a new session is pre-populated from the previous session, each set MUST carry over the `bumpIt` value from the corresponding set in the previous session.
- **FR-011**: Sets added manually (not carried over from a previous session) MUST default to `bumpIt: false`.

### Key Entities

- **Set Label**: An optional annotation on a single set. The first label type is "BumpIt", represented visually by 🆙. A set can have zero or one BumpIt label. Labels are stored per set, not per exercise or session.
- **Set**: An individual exercise entry within a session, consisting of weight, reps, and a `bumpIt` boolean field (defaults to `false` when absent or unset).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can apply or remove the BumpIt label to any set with a single tap — no additional confirmation dialogs or steps required.
- **SC-002**: 100% of sets marked BumpIt in edit mode show the 🆙 emoji on the last session display after saving, with no data loss.
- **SC-003**: The BumpIt emoji is visually distinct between labeled (fully visible) and unlabeled (semi-transparent) states, enabling users to identify labeled sets at a glance without confusion.
- **SC-004**: The edit view layout remains usable on small mobile screens with the additional emoji column present alongside the weight and reps fields.

## Clarifications

### Session 2026-03-22

- Q: How should the BumpIt label be stored on a set in the data model? → A: Boolean field per label — `bumpIt: true/false` on the set object.
- Q: When a new session is started, should BumpIt labels carry over from the previous session? → A: Yes — BumpIt labels from the previous session carry over as defaults when a new session is pre-populated.
- Q: On the read-only last session display, should the 🆙 emoji column be visible even when no sets have the BumpIt label? → A: Yes — column is always rendered; cells are empty for unlabeled sets.

## Assumptions

- The "last session display" refers to the existing read-only session summary shown on the exercise detail screen.
- The "edit session display" refers to the existing editable session view where users input or modify set data.
- Only one label type (BumpIt) is required for this feature. Each future label type will be added as a separate boolean field on the set object (e.g., `bumpIt: boolean`).
- Label state is stored per set and scoped within the session document.
- No undo/redo mechanism is required for toggling the label beyond the standard session save/discard flow.
