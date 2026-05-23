import type { Exercise } from '@/types'

/**
 * Find the insertion position for a new exercise.
 *
 * Rules:
 * 1. If category is specified, find the last exercise in that category,
 *    and insert immediately after it (position of last + 1).
 * 2. If there are no exercises in that category:
 *    - Find all active categories in alphabetical order (case-insensitive).
 *    - Find the last category that alphabetically precedes the target category.
 *    - Find the last exercise in that preceding category, and insert after it.
 *    - If no preceding category exists, insert at the beginning (position 1).
 * 3. If category is ungrouped/empty:
 *    - Ungrouped exercises sit last in the list (after all categorized exercises).
 *    - Insert at the end of the entire list (exercises.length + 1).
 */
export function findInsertPosition(exercises: Exercise[], _name: string, category?: string): number {
  const targetCat = (category || '').trim().toLowerCase()

  if (targetCat) {
    const sameCatExs = exercises.filter(
      (e) => (e.category || '').trim().toLowerCase() === targetCat,
    )
    if (sameCatExs.length > 0) {
      return sameCatExs[sameCatExs.length - 1].position + 1
    }
  }

  // Find unique active categories alphabetically (excluding ungrouped/empty)
  const activeCategories = Array.from(new Set(exercises.map((e) => e.category || '')))
    .map((c) => c.trim())
    .filter((c) => c !== '')
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))

  if (targetCat) {
    // Find the last category that is alphabetically less than the target category
    let prevCategory: string | null = null
    for (const cat of activeCategories) {
      if (cat.toLowerCase().localeCompare(targetCat) < 0) {
        prevCategory = cat
      } else {
        break
      }
    }

    if (prevCategory !== null) {
      const prevCatExs = exercises.filter(
        (e) => (e.category || '').trim().toLowerCase() === prevCategory!.toLowerCase(),
      )
      return prevCatExs[prevCatExs.length - 1].position + 1
    } else {
      // If there's no preceding category, insert at the very beginning
      return 1
    }
  } else {
    // For ungrouped, insert at the end of all exercises
    return exercises.length + 1
  }
}
