import { describe, it, expect } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import type { Exercise } from '@/types'
import { findInsertPosition } from './exercisePosition'

function ex(id: string, name: string, position: number, category?: string): Exercise {
  return { id, name, category, position, archived: false, createdAt: null as unknown as Timestamp }
}

describe('findInsertPosition', () => {
  it('returns 1 for an empty list', () => {
    expect(findInsertPosition([], 'Bench Press', 'Chest')).toBe(1)
    expect(findInsertPosition([], 'Plank')).toBe(1)
  })

  it('inserts at the end of the same category', () => {
    const exercises = [
      ex('1', 'Bench Press', 1, 'Chest'),
      ex('2', 'Incline Press', 2, 'Chest'),
      ex('3', 'Squat', 3, 'Legs'),
    ]
    // Should go after "Incline Press" (position 2 + 1 = 3)
    expect(findInsertPosition(exercises, 'Cable Fly', 'Chest')).toBe(3)
  })

  it('inserts alphabetically for a new category with preceding categories', () => {
    const exercises = [
      ex('1', 'Pull-up', 1, 'Back'),
      ex('2', 'Bench Press', 2, 'Chest'),
    ]
    // "Legs" is alphabetically after "Chest" -> insert after Chest (position 2 + 1 = 3)
    expect(findInsertPosition(exercises, 'Squat', 'Legs')).toBe(3)
  })

  it('inserts in the middle alphabetically when new category falls between existing categories', () => {
    const exercises = [
      ex('1', 'Pull-up', 1, 'Back'),
      ex('2', 'Squat', 2, 'Legs'),
    ]
    // "Chest" is between "Back" and "Legs" -> insert after Back (position 1 + 1 = 2)
    expect(findInsertPosition(exercises, 'Bench Press', 'Chest')).toBe(2)
  })

  it('inserts at position 1 if new category is alphabetically first', () => {
    const exercises = [
      ex('1', 'Bench Press', 1, 'Chest'),
      ex('2', 'Squat', 2, 'Legs'),
    ]
    // "Back" is before "Chest" -> insert at position 1
    expect(findInsertPosition(exercises, 'Pull-up', 'Back')).toBe(1)
  })

  it('inserts ungrouped exercises at the end of the entire list', () => {
    const exercises = [
      ex('1', 'Pull-up', 1, 'Back'),
      ex('2', 'Bench Press', 2, 'Chest'),
      ex('3', 'Plank', 3),
    ]
    // Ungrouped exercise should go at end (length + 1 = 4)
    expect(findInsertPosition(exercises, 'Ab Wheel')).toBe(4)
  })
})
