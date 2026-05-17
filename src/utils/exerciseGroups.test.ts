import { describe, it, expect } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import type { Exercise } from '@/types'
import { parseExerciseName, groupExercises } from './exerciseGroups'

function ex(id: string, name: string, position: number): Exercise {
  return { id, name, position, archived: false, createdAt: null as unknown as Timestamp }
}

describe('parseExerciseName', () => {
  it('splits on first colon and trims both parts', () => {
    expect(parseExerciseName('Chest: Bench Press')).toEqual({ group: 'Chest', shortName: 'Bench Press' })
  })

  it('trims whitespace around colon', () => {
    expect(parseExerciseName('Back :  Pull-up  ')).toEqual({ group: 'Back', shortName: 'Pull-up' })
  })

  it('uses only the first colon as the split point', () => {
    expect(parseExerciseName('A: B: C')).toEqual({ group: 'A', shortName: 'B: C' })
  })

  it('returns ungrouped when no colon present', () => {
    expect(parseExerciseName('Plank')).toEqual({ group: '(ungrouped)', shortName: 'Plank' })
  })

  it('returns ungrouped for empty string', () => {
    expect(parseExerciseName('')).toEqual({ group: '(ungrouped)', shortName: '' })
  })
})

describe('groupExercises', () => {
  it('returns empty array for empty input', () => {
    expect(groupExercises([])).toEqual([])
  })

  it('groups exercises by prefix and sorts groups alphabetically', () => {
    const exercises = [
      ex('1', 'Chest: Bench Press', 1),
      ex('2', 'Back: Pull-up', 2),
      ex('3', 'Chest: Cable Crossover', 3),
      ex('4', 'Back: Row', 4),
    ]
    const groups = groupExercises(exercises)
    expect(groups).toHaveLength(2)
    expect(groups[0].name).toBe('Back')
    expect(groups[0].exercises).toEqual([
      { id: '2', shortName: 'Pull-up' },
      { id: '4', shortName: 'Row' },
    ])
    expect(groups[1].name).toBe('Chest')
    expect(groups[1].exercises).toEqual([
      { id: '1', shortName: 'Bench Press' },
      { id: '3', shortName: 'Cable Crossover' },
    ])
  })

  it('places ungrouped exercises last', () => {
    const exercises = [
      ex('1', 'Chest: Bench Press', 1),
      ex('2', 'Plank', 2),
      ex('3', 'Abs: Crunch', 3),
    ]
    const groups = groupExercises(exercises)
    expect(groups).toHaveLength(3)
    expect(groups[0].name).toBe('Abs')
    expect(groups[1].name).toBe('Chest')
    expect(groups[2].name).toBe('(ungrouped)')
    expect(groups[2].exercises).toEqual([{ id: '2', shortName: 'Plank' }])
  })

  it('sorts named groups case-insensitively', () => {
    const exercises = [
      ex('1', 'legs: Squat', 1),
      ex('2', 'Arms: Curl', 2),
    ]
    const groups = groupExercises(exercises)
    expect(groups[0].name).toBe('Arms')
    expect(groups[1].name).toBe('legs')
  })

  it('preserves position-based order of exercises within a group', () => {
    const exercises = [
      ex('1', 'Chest: Bench Press', 1),
      ex('2', 'Chest: Incline Press', 2),
      ex('3', 'Chest: Cable Crossover', 3),
    ]
    const [group] = groupExercises(exercises)
    expect(group.exercises.map((e) => e.id)).toEqual(['1', '2', '3'])
  })

  it('handles all ungrouped exercises', () => {
    const exercises = [ex('1', 'Plank', 1), ex('2', 'Run', 2)]
    const groups = groupExercises(exercises)
    expect(groups).toHaveLength(1)
    expect(groups[0].name).toBe('(ungrouped)')
    expect(groups[0].exercises).toHaveLength(2)
  })
})
