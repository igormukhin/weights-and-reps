# Implementation Plan: BumpIt Set Label

**Branch**: `003-set-bump-label` | **Date**: 2026-03-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-set-bump-label/spec.md`

## Summary

Add a BumpIt label (🆙 emoji) to individual sets that users can toggle in the session edit view. The label persists as a `bumpIt?: boolean` field on each `Set` object in Firestore. The read-only last session display always shows the emoji column, with 🆙 visible for labeled sets. BumpIt state carries over automatically when a new session is pre-populated from the previous one.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Vue 3 (Composition API), Vuetify 3, Pinia, Firebase SDK v10+
**Storage**: Firestore — `users/{uid}/exercises/{exerciseId}/sessions/{YYYY-MM-DD}` (embedded `sets[]` array)
**Testing**: Manual — browser/device viewport validation
**Target Platform**: Mobile web (≤375px primary), Chrome/Safari on iOS/Android
**Project Type**: Mobile web application (PWA-style)
**Performance Goals**: Auto-save within 2 seconds of last change (existing constraint, unchanged)
**Constraints**: Touch targets ≥44×44px; no new external dependencies; Firestore rules require no change
**Scale/Scope**: Single-user data model; no concurrency concerns

## Constitution Check

*Constitution version: 1.0.0 | Ref: `.specify/memory/constitution.md`*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity First | ✅ PASS | Single-tap toggle; emoji column is always present but visually minimal (semi-transparent when unused). No additional screens or confirmation steps. |
| II. Mobile-First, Touch-Optimized | ✅ PASS | BumpIt column uses a `v-btn` with adequate tap area (≥44×44px). Must be verified on ≤375px viewport. |
| III. Data Integrity & Auto-Save | ✅ PASS | `bumpIt` is part of the `Set` object; existing 2-second debounced auto-save covers it with no changes to save logic. |
| IV. Per-User Data Isolation | ✅ PASS | No Firestore rules change needed. Existing wildcard rule already covers all fields in session documents. |
| V. Consistent, Predictable UX | ✅ PASS | BumpIt carry-over on new session mirrors the existing weight/reps carry-over behavior. Read-only column always rendered (stable layout). |

**Complexity Tracking**: No violations. No complexity justification required.

## Project Structure

### Documentation (this feature)

```text
specs/003-set-bump-label/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Codebase findings and decisions
├── data-model.md        # Set type change and Firestore schema
├── quickstart.md        # Developer implementation guide
└── tasks.md             # Phase 2 output (/speckit.tasks command — NOT created here)
```

### Source Code (affected files)

```text
src/
├── types/
│   └── index.ts                          # Add bumpIt?: boolean to Set interface
├── composables/
│   └── useSession.ts                     # Add toggleBumpIt(index) function
├── components/session/
│   └── SetRow.vue                        # Add BumpIt emoji column; update col layout
└── views/
    └── ExerciseDetailView.vue            # Update edit headers; update read-only table; wire toggleBumpIt
```

## Phase 0: Research

See [research.md](research.md) for full findings.

**Key decisions resolved:**

| Decision | Outcome |
|----------|---------|
| Data field | `bumpIt?: boolean` on `Set` (per clarification Q1) |
| Carry-over | Automatic via existing `startSession()` spread — no code change |
| Toggle function | Dedicated `toggleBumpIt(index)` in `useSession` |
| Read-only column | Always rendered (per clarification Q3) |
| Firestore rules | No change required |
| Column layout | `1+5+1+5` cols in SetRow and edit headers |

## Phase 1: Design & Contracts

### Data Model

See [data-model.md](data-model.md) for full schema.

**`Set` interface change** (`src/types/index.ts`):
```ts
// Before
interface Set { weight: number; reps?: number }

// After
interface Set { weight: number; reps?: number; bumpIt?: boolean }
```

No migration required. Existing documents without `bumpIt` are valid; absent = `false`.

### Component Contracts

#### `SetRow.vue` — new prop and emit

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `bumpIt` | `boolean \| undefined` | `undefined` (= false) | Whether BumpIt label is active for this set |

| Emit | Payload | Description |
|------|---------|-------------|
| `update:bumpIt` | `boolean` | Fired when user taps the 🆙 emoji; payload is the new value |

Column layout change: `cols` goes from `1 / 6 / 5` to `1 / 5 / 1 / 5`.

#### `useSession` — new function exposed

| Function | Signature | Description |
|----------|-----------|-------------|
| `toggleBumpIt` | `(index: number) => void` | Flips `bumpIt` on set at `index`; schedules auto-save |

### UI Layout

**Edit mode column headers** (`ExerciseDetailView.vue`):
```
| # (1) | kg (5) | [empty] (1) | Reps (5) |
```

**Read-only last session table** (`ExerciseDetailView.vue`):
```
| # | Weight | 🆙 | Reps |
```
The 🆙 column header is empty (no text). The cell shows `🆙` when `bumpIt === true`, empty string otherwise.

### Agent Context

Agent context updated via script (see below).
