import { describe, it, expect } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import type { Exercise } from '@/types'
import { groupExercises } from './exerciseGroups'

function ex(id: string, name: string, position: number, category?: string): Exercise {
  return { id, name, category, position, archived: false, createdAt: null as unknown as Timestamp }
}

describe('groupExercises', () => {
  it('returns empty array for empty input', () => {
    expect(groupExercises([])).toEqual([])
  })

  it('groups exercises by category and sorts groups alphabetically', () => {
    const exercises = [
      ex('1', 'Bench Press', 1, 'Chest'),
      ex('2', 'Pull-up', 2, 'Back'),
      ex('3', 'Cable Crossover', 3, 'Chest'),
      ex('4', 'Row', 4, 'Back'),
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
      ex('1', 'Bench Press', 1, 'Chest'),
      ex('2', 'Plank', 2),
      ex('3', 'Crunch', 3, 'Abs'),
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
      ex('1', 'Squat', 1, 'legs'),
      ex('2', 'Curl', 2, 'Arms'),
    ]
    const groups = groupExercises(exercises)
    expect(groups[0].name).toBe('Arms')
    expect(groups[1].name).toBe('legs')
  })

  it('preserves position-based order of exercises within a group', () => {
    const exercises = [
      ex('1', 'Bench Press', 1, 'Chest'),
      ex('2', 'Incline Press', 2, 'Chest'),
      ex('3', 'Cable Crossover', 3, 'Chest'),
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
