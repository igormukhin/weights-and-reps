import type { Exercise } from '@/types'

export function longestCommonPrefixLength(a: string, b: string): number {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  return i
}

/**
 * Find the insertion position for a new exercise using longest common prefix.
 * Finds the exercise whose name shares the longest common prefix with newName
 * (case-insensitive) and returns the position immediately after it.
 * On a tie, the exercise with the highest position wins (inserts after the last
 * tied exercise). If the list is empty, returns 1.
 */
export function findInsertPosition(exercises: Exercise[], newName: string): number {
  const lower = newName.trim().toLowerCase()
  let bestMatchLength = -1
  let insertAfterPosition = 0

  for (const ex of exercises) {
    const lcpLen = longestCommonPrefixLength(lower, ex.name.toLowerCase())
    if (lcpLen >= bestMatchLength) {
      bestMatchLength = lcpLen
      insertAfterPosition = ex.position
    }
  }

  return insertAfterPosition + 1
}
