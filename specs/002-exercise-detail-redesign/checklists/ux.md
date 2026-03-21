# UX & Data Requirements Checklist: Exercise Detail Page Redesign

**Purpose**: PR-gate validation of UX/interaction and data requirements quality — tests whether requirements are complete, clear, consistent, and measurable. Not an implementation test.
**Created**: 2026-03-21
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [contracts/useSession-api.md](../contracts/useSession-api.md)

## Requirement Completeness

- [ ] CHK001 — Are the visual states of the "Pump it!" button fully specified (visible in read-only mode, hidden/replaced in edit mode)? [Completeness, Spec §FR-002, §FR-010]
- [ ] CHK002 — Are the visual states of the "Delete" button fully specified (visible only in edit mode, hidden in read-only mode)? [Completeness, Spec §FR-007, §FR-010]
- [ ] CHK003 — Is the layout of the read-only last session table specified (columns, ordering, what happens with zero sets)? [Completeness, Spec §FR-001]
- [ ] CHK004 — Are save-state feedback requirements (saving/saved/error indicator) explicitly carried over into the redesigned edit mode? [Completeness, Gap]
- [ ] CHK005 — Is the transition animation or visual cue (if any) between read-only and edit mode specified? [Completeness, Gap]
- [ ] CHK006 — Are requirements defined for what the user sees while the page is loading (before `init()` resolves)? [Completeness, Gap]

## Requirement Clarity

- [ ] CHK007 — Is "most recent past session" unambiguously defined — specifically, does it exclude today's session if one exists? [Clarity, Spec §Assumptions]
- [ ] CHK008 — Is "automatically enter edit mode" clearly defined — does it mean the page loads directly in edit state with no intermediate read-only flash? [Clarity, Spec §FR-006, §US-3]
- [ ] CHK009 — Is "saved automatically" quantified with a specific maximum delay (e.g., within 2 seconds of last change)? [Clarity, Spec §FR-005, Spec §Assumptions]
- [ ] CHK010 — Is "pre-filled with last session's sets" unambiguous — does it copy both weight and reps values, or only one? [Clarity, Spec §Clarifications, §FR-003]
- [ ] CHK011 — Is the confirmation dialog for delete specified clearly enough to be tested — what text/options does it contain? [Clarity, Spec §FR-008]
- [ ] CHK012 — Is "empty state message" content specified, or is the exact wording left undefined? [Clarity, Spec §FR-011]

## Requirement Consistency

- [ ] CHK013 — Is the pre-fill behavior consistent between the first-ever session (no last session exists → empty table) and subsequent sessions (last session exists → pre-fill)? [Consistency, Spec §FR-003, §Clarifications Q1]
- [ ] CHK014 — Do the acceptance scenarios in US-2 ("Pump it!" flow) and US-3 (auto-edit mode) consistently define the same edit-mode appearance and behavior? [Consistency, Spec §US-2, §US-3]
- [ ] CHK015 — Is the auto-save behavior consistently specified for both the "Pump it!" immediate-persist path and the subsequent edit-field debounce path? [Consistency, Spec §FR-005, Plan research.md §4]
- [ ] CHK016 — Are the delete post-conditions consistent between the spec (return to read-only showing last session) and the edge case where no past session exists (empty state)? [Consistency, Spec §FR-009, §Edge Cases]

## Acceptance Criteria Quality

- [ ] CHK017 — Is SC-001 ("1 click to start a session") objectively measurable — is it clear that clicking "Pump it!" counts as the single click? [Measurability, Spec §SC-001]
- [ ] CHK018 — Is SC-002 ("100% of edits survive a page refresh") realistically verifiable within the 2-second auto-save window, and is that window referenced in the success criterion? [Measurability, Spec §SC-002]
- [ ] CHK019 — Is SC-003 ("0 additional clicks to reach edit mode when today's session exists") unambiguous — does "0 clicks" mean the page opens directly in edit mode with no user action required? [Measurability, Spec §SC-003]
- [ ] CHK020 — Can SC-005 ("previous session's data always visible before starting a new session") be objectively verified, or does "always visible" need to account for the pre-fill state where last data is shown inside edit fields? [Measurability, Spec §SC-005]

## Scenario Coverage

- [ ] CHK021 — Are requirements defined for the scenario where the user clicks "Pump it!", the Firestore write succeeds, but the page immediately loses connectivity — does edit mode remain active? [Coverage, Gap]
- [ ] CHK022 — Is the scenario covered where the user adds sets in edit mode and then clicks "Delete" — are the unsaved in-progress sets discarded along with the session? [Coverage, Edge Cases]
- [ ] CHK023 — Are requirements defined for the scenario where the user deletes today's session and then immediately clicks "Pump it!" again — does the flow restart correctly? [Coverage, Gap]
- [ ] CHK024 — Is the scenario covered where `lastSets` is empty (first session ever) and the user clicks "Pump it!" — is the expected starting state (empty table, 0 rows) explicitly specified? [Coverage, Spec §FR-003, §US-2 scenario 1a]
- [ ] CHK025 — Is the behavior specified when the user opens the page on a different device mid-session (today's session already exists on server from another device)? [Coverage, Gap]

## Edge Case Coverage

- [ ] CHK026 — Is the behavior specified when auto-save fails after the user has added multiple sets — does the error indicator persist until the next successful save? [Edge Case, Spec §Edge Cases]
- [ ] CHK027 — Is there a requirement covering what happens if the user deletes a session that has 0 sets (clicked "Pump it!" but never entered data)? [Edge Case, Spec §Edge Cases]
- [ ] CHK028 — Is the behavior specified when `getLastSession` returns a session with 0 sets — does pre-fill result in an empty table or a default row count? [Edge Case, Gap]
- [ ] CHK029 — Is the behavior defined when the user rapidly toggles between "Pump it!" (create) and "Delete" (destroy) within the same page visit — are race conditions in state transitions addressed? [Edge Case, Gap]

## Dependencies & Assumptions

- [ ] CHK030 — Is the assumption that "today" is the user's local device date explicitly documented and its implications addressed (e.g., timezone changes mid-session)? [Assumption, Spec §Assumptions]
- [ ] CHK031 — Is the assumption that auto-save fires on every individual field change validated against the 2-second debounce behavior — are rapid sequential edits explicitly covered? [Assumption, Spec §Assumptions, Plan research.md §4]
- [ ] CHK032 — Is the dependency on the existing `useSession` composable contract documented — are breaking changes to its API explicitly flagged? [Dependency, Plan contracts/useSession-api.md]
- [ ] CHK033 — Is the assumption that one session per exercise per calendar day is enforced at the data layer (not just the UI layer) explicitly stated? [Assumption, Spec §Assumptions]

## Ambiguities & Conflicts

- [ ] CHK034 — Does the spec resolve the potential conflict between "pre-fill from last session" (FR-003) and the constitution's prefill behavior ("tapping an empty 'new' field copies the previous set's value") — are both behaviors compatible in edit mode? [Conflict, Spec §FR-003, Constitution §V]
- [ ] CHK035 — Is the term "edit mode" used consistently throughout spec, plan, and contracts, or does it have different implied meanings in different sections? [Ambiguity, Traceability]
- [ ] CHK036 — Is the scope of "Delete" unambiguous — does it delete only today's session document, or also any in-memory unsaved state, and does the spec say so explicitly? [Ambiguity, Spec §FR-009]

## Notes

- Check items off as completed: `[x]`
- Add findings or concerns inline below each item
- Items flagged `[Gap]` indicate requirements not yet present in the spec — they may need to be added or explicitly declared out of scope
- Items flagged `[Conflict]` require resolution before implementation begins
