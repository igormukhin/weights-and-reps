# Research: BumpIt Set Label

**Feature**: 003-set-bump-label
**Date**: 2026-03-22

## Codebase Findings

### Current Set Data Model

`src/types/index.ts` — `Set` interface currently has two fields:
```ts
interface Set {
  weight: number    // required
  reps?: number     // optional
}
```
`bumpIt?: boolean` can be added as an optional field with zero breakage. Absence is treated as `false` everywhere.

### How Sets Are Persisted

`src/services/sessions.ts` — `saveSession()` writes the `sets` array directly to Firestore via `setDoc` with `{ merge: true }`. Any new field on a set object (like `bumpIt`) will be persisted automatically with no service-layer changes.

### How `Partial<Set>` Works in Edit State

`src/composables/useSession.ts` — `todaySets` is typed as `Ref<Partial<Set>[]>`. Edit-state sets can be incomplete (weight/reps undefined). The `persist()` function filters to valid sets (`weight >= 0.5`) before saving. `bumpIt` is not a validity criterion — it should be carried through the filter independently of weight validity.

**Decision**: The persist filter checks `weight` only. A set without `bumpIt` will persist as `bumpIt` absent (= false). A set with `bumpIt: true` will persist the field. No filter change needed.

### How `startSession()` Carries Over Data

`useSession.ts:57–63` — `startSession()` copies last session sets via spread:
```ts
todaySets.value = lastSets.value.map((s) => ({ ...s }))
```
Since `bumpIt` is a field on `Set`, spread automatically carries it over. **No code change needed for FR-010.**

### SetRow Column Layout

`src/components/session/SetRow.vue` — current cols: `1 + 6 + 5 = 12`.
New layout to fit a BumpIt emoji column: `1 + 5 + 1 + 5 = 12` (#, weight, bump, reps).
The emoji column needs a tap target of ≥ 44×44px (Constitution II). A `v-btn` with `size="small"` and `variant="text"` satisfies this.

### ExerciseDetailView: Two Display Contexts

`src/views/ExerciseDetailView.vue`:
- **Read-only table** (lines 34–49): HTML `<table>` with `<thead>` and `<tbody>`. Add a `<th>` (empty or 🆙) and `<td>` column after weight. Column always rendered (per clarification Q3).
- **Edit mode headers** (lines 67–71): `v-row` with `cols="1/6/5"`. Must match new `1+5+1+5` layout.

### `updateSet` Function

`useSession.ts:68–77` — typed as `field: 'weight' | 'reps'`, value is `number | null`.
BumpIt is a boolean toggle, not a numeric field. **Decision**: Add a dedicated `toggleBumpIt(index: number)` function rather than extending `updateSet`, keeping the semantics clean.

### Firestore Security Rules

`firestore.rules` — wildcard rule `match /users/{uid}/{document=**}` already covers all fields in session documents. **No rules change required.** Constitution principle IV is satisfied without modification.

---

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data field shape | `bumpIt?: boolean` on `Set` | Per clarification Q1: boolean field per label |
| Carry-over on new session | Automatic via spread | `startSession()` already spreads all Set fields; no code change |
| Toggle mechanism | Dedicated `toggleBumpIt(index)` in `useSession` | Boolean toggle semantics differ from numeric `updateSet` |
| Read-only column visibility | Always rendered | Per clarification Q3; stable layout, no reflow |
| Firestore rules | No change | Existing wildcard rule already covers new field |
| Column layout | `1+5+1+5` cols | Fits 12-col grid; emoji col is narrow (1 col) |
| Tap target | `v-btn variant="text"` wrapping emoji | Satisfies ≥44×44px touch target (Constitution II) |
