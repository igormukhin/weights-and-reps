import type { Exercise } from '@/types'

export interface ExerciseGroup {
  name: string
  exercises: { id: string; shortName: string }[]
}

export function parseExerciseName(name: string): { group: string; shortName: string } {
  const colonIndex = name.indexOf(':')
  if (colonIndex === -1) return { group: '(ungrouped)', shortName: name }
  return {
    group: name.slice(0, colonIndex).trim(),
    shortName: name.slice(colonIndex + 1).trim(),
  }
}

export function groupExercises(exercises: Exercise[]): ExerciseGroup[] {
  const map = new Map<string, { id: string; shortName: string }[]>()
  for (const ex of exercises) {
    const { group, shortName } = parseExerciseName(ex.name)
    if (!map.has(group)) map.set(group, [])
    map.get(group)!.push({ id: ex.id, shortName })
  }

  const named: ExerciseGroup[] = []
  let ungrouped: ExerciseGroup | null = null

  for (const [name, exs] of map) {
    if (name === '(ungrouped)') {
      ungrouped = { name, exercises: exs }
    } else {
      named.push({ name, exercises: exs })
    }
  }

  named.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  if (ungrouped) named.push(ungrouped)
  return named
}
