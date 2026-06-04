import type { ExerciseLog } from '@/types'

export function getMaxWeight(log: ExerciseLog): number | null {
  const weights = log.sets
    .map((set) => set.weight)
    .filter((weight) => typeof weight === 'number' && Number.isFinite(weight))

  if (weights.length === 0) return null

  return Math.max(...weights)
}

export function formatWeight(weight: number | null): string {
  if (weight === null) return '-'

  return `${weight.toLocaleString('de-DE', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} kg`
}
