import { describe, it, expect } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import type { ExerciseLog, Set } from '@/types'
import { formatPastExerciseLogWhen } from './date'
import { formatWeight, getMaxWeight } from './exerciseLogSummary'

function log(sets: Set[]): ExerciseLog {
  return {
    date: '2026-06-01',
    sets,
    updatedAt: null as unknown as Timestamp,
  }
}

describe('getMaxWeight', () => {
  it('returns the highest weight in the ExerciseLog', () => {
    expect(getMaxWeight(log([
      { weight: 75, reps: 8 },
      { weight: 80, reps: 5 },
      { weight: 77.5, reps: 6 },
    ]))).toBe(80)
  })

  it('treats less assistance as higher weight for assisted exercises', () => {
    expect(getMaxWeight(log([
      { weight: -20, reps: 8 },
      { weight: -5, reps: 6 },
    ]))).toBe(-5)
  })

  it('returns null when an ExerciseLog has no Sets', () => {
    expect(getMaxWeight(log([]))).toBeNull()
  })
})

describe('formatWeight', () => {
  it('formats kilograms with one decimal', () => {
    expect(formatWeight(80)).toBe('80,0 kg')
  })

  it('shows a dash when no Max Weight exists', () => {
    expect(formatWeight(null)).toBe('-')
  })
})

describe('formatPastExerciseLogWhen', () => {
  it('shows days ago when the ExerciseLog is not more than 30 days in the past', () => {
    expect(formatPastExerciseLogWhen('2026-06-03', '2026-06-04')).toBe('1 day ago')
    expect(formatPastExerciseLogWhen('2026-05-05', '2026-06-04')).toBe('30 days ago')
  })

  it('shows the date when the ExerciseLog is more than 30 days in the past', () => {
    expect(formatPastExerciseLogWhen('2026-05-04', '2026-06-04')).toBe('04.05.2026')
  })
})
