import type { Set } from '@/types'

/**
 * A set row is empty when neither weight nor reps has a value.
 * bumpIt alone does not count as data — a bumpIt-only row is still empty.
 */
export function isEmptySet(set: Partial<Set>): boolean {
  return set.weight === undefined && set.reps === undefined
}

/**
 * Mutates the given array in place so that after this call:
 *   1. There are at least 3 rows.
 *   2. At most one trailing empty row exists (subject to rule 1).
 *   3. The last row is empty (subject to rules 1 and 2).
 */
export function enforceRowInvariants(sets: Partial<Set>[]): void {
  // Rule 2: while there are 2+ trailing empty rows and length > 3, pop one.
  while (
    sets.length > 3 &&
    isEmptySet(sets[sets.length - 1]!) &&
    isEmptySet(sets[sets.length - 2]!)
  ) {
    sets.pop()
  }
  // Rule 3: if last row has data (or array is empty), append an empty row.
  const last = sets[sets.length - 1]
  if (last === undefined || !isEmptySet(last)) {
    sets.push({})
  }
  // Rule 1: pad up to 3.
  while (sets.length < 3) {
    sets.push({})
  }
}
