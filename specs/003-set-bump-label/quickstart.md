# Quickstart: BumpIt Set Label

**Feature**: 003-set-bump-label
**Branch**: `003-set-bump-label`

## What This Feature Does

Adds a tappable 🆙 emoji column to each set row in the session edit view. Tapping toggles the BumpIt label on that set. The emoji appears semi-transparent when unlabeled, fully opaque when labeled. The read-only last session display always shows the emoji column; labeled sets display 🆙, unlabeled sets show an empty cell.

## Files to Change

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `bumpIt?: boolean` to `Set` interface |
| `src/composables/useSession.ts` | Add `toggleBumpIt(index: number)` function |
| `src/components/session/SetRow.vue` | Add BumpIt emoji column (between weight and reps); update col layout `1+5+1+5` |
| `src/views/ExerciseDetailView.vue` | Edit headers: update to `1+5+1+5`; read-only table: add 🆙 column; wire `toggleBumpIt` to `SetRow` |

## Key Implementation Notes

### 1. Type Change
Add to `Set` in `src/types/index.ts`:
```ts
bumpIt?: boolean
```

### 2. `toggleBumpIt` in `useSession`
```ts
function toggleBumpIt(index: number): void {
  const set = { ...todaySets.value[index] }
  set.bumpIt = !set.bumpIt
  todaySets.value[index] = set
  scheduleSave()
}
```
Return it from the composable alongside other mutations.

### 3. SetRow Column Layout
New grid: `cols="1"` (#) + `cols="5"` (weight) + `cols="1"` (BumpIt) + `cols="5"` (reps) = 12.

BumpIt column:
```html
<v-col cols="1" class="d-flex align-center justify-center">
  <v-btn
    icon
    variant="text"
    size="small"
    :style="{ opacity: bumpIt ? 1 : 0.25 }"
    @click="emit('update:bumpIt', !bumpIt)"
  >
    🆙
  </v-btn>
</v-col>
```

New props/emits on `SetRow`:
```ts
defineProps<{
  // ... existing props
  bumpIt?: boolean
}>()

defineEmits<{
  // ... existing emits
  'update:bumpIt': [value: boolean]
}>()
```

### 4. ExerciseDetailView — Edit Mode Headers
```html
<v-col cols="1" class="text-center">#</v-col>
<v-col cols="5" class="text-center">kg</v-col>
<v-col cols="1"></v-col>   <!-- no header for BumpIt column -->
<v-col cols="5" class="text-center">Reps</v-col>
```

Wire BumpIt to SetRow:
```html
<SetRow
  ...
  :bump-it="set.bumpIt"
  @update:bump-it="(v) => toggleBumpIt(index)"
/>
```
(The toggle ignores the emitted value and just flips; the emitted boolean is redundant but consistent with Vue v-model conventions.)

### 5. ExerciseDetailView — Read-Only Table
Add column to `<thead>`:
```html
<th class="text-right pb-1 pr-6">Weight</th>
<th class="pb-1 pr-6"></th>   <!-- BumpIt column header (empty) -->
<th class="text-right pb-1">Reps</th>
```

Add cell to each `<tr>` in `<tbody>`:
```html
<td class="pr-6 text-right py-1">{{ set.weight.toFixed(1) }} kg</td>
<td class="pr-6 py-1">{{ set.bumpIt ? '🆙' : '' }}</td>
<td class="text-right py-1">{{ set.reps }}</td>
```

## Validation Checklist

- [ ] Toggle works: tapping 🆙 in edit mode switches between semi-transparent and fully opaque
- [ ] Persist: BumpIt state saves to Firestore within 2 seconds (verify in Firebase console)
- [ ] Carry-over: starting a new session copies BumpIt from last session
- [ ] Read-only: 🆙 column always visible; shows emoji for labeled sets, empty for unlabeled
- [ ] Manual new set: `addSet()` pushes `{}` — `bumpIt` defaults to undefined (= false) ✓
- [ ] Delete set: set deleted with its label state, no orphaned data ✓
- [ ] Mobile layout: verify on ≤375px viewport that all four columns are readable
- [ ] Touch target: BumpIt button meets ≥44×44px (use browser device toolbar)
