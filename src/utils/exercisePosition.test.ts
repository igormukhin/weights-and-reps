import { describe, it, expect } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import type { Exercise } from '@/types'
import { longestCommonPrefixLength, findInsertPosition } from './exercisePosition'

function ex(id: string, name: string, position: number): Exercise {
  return { id, name, position, hidden: false, createdAt: null as unknown as Timestamp }
}

describe('longestCommonPrefixLength', () => {
  it('returns full length when strings are identical', () => {
    expect(longestCommonPrefixLength('bench press', 'bench press')).toBe(11)
  })

  it('returns 0 for strings with no common prefix', () => {
    expect(longestCommonPrefixLength('squat', 'bench press')).toBe(0)
  })

  it('returns length of shared prefix', () => {
    expect(longestCommonPrefixLength('bench fly', 'bench press')).toBe(6)
  })

  it('handles empty strings', () => {
    expect(longestCommonPrefixLength('', 'bench')).toBe(0)
    expect(longestCommonPrefixLength('bench', '')).toBe(0)
    expect(longestCommonPrefixLength('', '')).toBe(0)
  })

  it('returns shorter string length when one is prefix of the other', () => {
    expect(longestCommonPrefixLength('bench', 'bench press')).toBe(5)
    expect(longestCommonPrefixLength('bench press', 'bench')).toBe(5)
  })
})

describe('findInsertPosition', () => {
  it('returns 1 for an empty list', () => {
    expect(findInsertPosition([], 'Squat')).toBe(1)
  })

  it('inserts after the exercise with the longest common prefix', () => {
    const exercises = [
      ex('1', 'Bench Press', 1),
      ex('2', 'Squat', 2),
      ex('3', 'Deadlift', 3),
    ]
    // "Bench Fly" shares "bench " (6 chars) with "Bench Press", 0 with others
    expect(findInsertPosition(exercises, 'Bench Fly')).toBe(2)
  })

  it('inserts after a full-name prefix match', () => {
    const exercises = [
      ex('1', 'Bench Press', 1),
      ex('2', 'Squat', 2),
    ]
    // "Bench Press Dumbbell" shares all of "bench press" with position 1
    expect(findInsertPosition(exercises, 'Bench Press Dumbbell')).toBe(2)
  })

  it('inserts at end when no exercise shares any prefix', () => {
    const exercises = [
      ex('1', 'Bench Press', 1),
      ex('2', 'Squat', 2),
      ex('3', 'Deadlift', 3),
    ]
    // "Overhead Press" shares nothing with any exercise — last exercise wins
    expect(findInsertPosition(exercises, 'Overhead Press')).toBe(4)
  })

  it('is case-insensitive', () => {
    const exercises = [
      ex('1', 'Bench Press', 1),
      ex('2', 'Squat', 2),
    ]
    expect(findInsertPosition(exercises, 'bench fly')).toBe(2)
    expect(findInsertPosition(exercises, 'BENCH FLY')).toBe(2)
  })

  it('on a tie, inserts after the last tied exercise', () => {
    // "Curl" shares "c" with "Cable Row" (1 char) and 0 with others
    // "Cable Fly" also shares "c" with "Cable Row" and "curl" would share...
    // Let's set up a clear tie: two exercises share same prefix length
    const exercises = [
      ex('1', 'Cable Row', 1),
      ex('2', 'Cable Fly', 2),
      ex('3', 'Squat', 3),
    ]
    // "Cable Pull" shares "cable " (6 chars) with both "Cable Row" and "Cable Fly"
    // Tie → last tied exercise wins (position 2)
    expect(findInsertPosition(exercises, 'Cable Pull')).toBe(3)
  })

  it('trims whitespace from the new name before matching', () => {
    const exercises = [
      ex('1', 'Bench Press', 1),
      ex('2', 'Squat', 2),
    ]
    expect(findInsertPosition(exercises, '  Bench Fly  ')).toBe(2)
  })
})
