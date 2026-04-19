import { describe, it, expect } from 'vitest'
import type { Set } from '@/types'
import { isEmptySet, enforceRowInvariants } from './setRowInvariants'

describe('isEmptySet', () => {
  it('is true when both weight and reps are undefined', () => {
    expect(isEmptySet({})).toBe(true)
  })

  it('is true when only bumpIt is set (bumpIt does not count)', () => {
    expect(isEmptySet({ bumpIt: true })).toBe(true)
  })

  it('is false when weight is set', () => {
    expect(isEmptySet({ weight: 100 })).toBe(false)
  })

  it('is false when reps is set', () => {
    expect(isEmptySet({ reps: 8 })).toBe(false)
  })

  it('is false when both weight and reps are set', () => {
    expect(isEmptySet({ weight: 100, reps: 8 })).toBe(false)
  })

  it('is false when weight is 0 (zero kg is a defined value)', () => {
    expect(isEmptySet({ weight: 0 })).toBe(false)
  })
})

describe('enforceRowInvariants', () => {
  it('pads an empty array up to 3 empty rows', () => {
    const sets: Partial<Set>[] = []
    enforceRowInvariants(sets)
    expect(sets).toEqual([{}, {}, {}])
  })

  it('pads a single-row array up to 3 rows', () => {
    const sets: Partial<Set>[] = [{ weight: 100 }]
    enforceRowInvariants(sets)
    expect(sets).toEqual([{ weight: 100 }, {}, {}])
  })

  it('keeps 3 all-empty rows unchanged', () => {
    const sets: Partial<Set>[] = [{}, {}, {}]
    enforceRowInvariants(sets)
    expect(sets).toEqual([{}, {}, {}])
  })

  it('appends an empty row when the last row has data (3 filled)', () => {
    const sets: Partial<Set>[] = [
      { weight: 100, reps: 8 },
      { weight: 100, reps: 8 },
      { weight: 100, reps: 8 },
    ]
    enforceRowInvariants(sets)
    expect(sets).toEqual([
      { weight: 100, reps: 8 },
      { weight: 100, reps: 8 },
      { weight: 100, reps: 8 },
      {},
    ])
  })

  it('appends an empty row when the last row has only weight', () => {
    const sets: Partial<Set>[] = [{}, {}, { weight: 100 }]
    enforceRowInvariants(sets)
    expect(sets).toEqual([{}, {}, { weight: 100 }, {}])
  })

  it('appends an empty row when the last row has only reps', () => {
    const sets: Partial<Set>[] = [{}, {}, { reps: 8 }]
    enforceRowInvariants(sets)
    expect(sets).toEqual([{}, {}, { reps: 8 }, {}])
  })

  it('is idempotent when last row is already empty and length > 3', () => {
    const sets: Partial<Set>[] = [
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
      {},
    ]
    enforceRowInvariants(sets)
    expect(sets).toEqual([
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
      {},
    ])
  })

  it('trims one trailing empty when there are two and length > 3', () => {
    const sets: Partial<Set>[] = [
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
      {},
      {},
    ]
    enforceRowInvariants(sets)
    expect(sets).toEqual([
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
      {},
    ])
  })

  it('trims multiple trailing empties down to one when length > 3', () => {
    const sets: Partial<Set>[] = [
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
      {},
      {},
      {},
    ]
    enforceRowInvariants(sets)
    expect(sets).toEqual([
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
      {},
    ])
  })

  it('does not trim below 3 rows even when trailing empties are present', () => {
    const sets: Partial<Set>[] = [{ weight: 100 }, {}, {}, {}]
    enforceRowInvariants(sets)
    expect(sets).toEqual([{ weight: 100 }, {}, {}])
  })

  it('does not trim below 3 rows when there are many trailing empties', () => {
    const sets: Partial<Set>[] = [{ weight: 100 }, {}, {}, {}, {}]
    enforceRowInvariants(sets)
    expect(sets).toEqual([{ weight: 100 }, {}, {}])
  })

  it('pads a 2-row filled array to 3 rows with trailing empty', () => {
    const sets: Partial<Set>[] = [{ weight: 100 }, { weight: 100 }]
    enforceRowInvariants(sets)
    expect(sets).toEqual([{ weight: 100 }, { weight: 100 }, {}])
  })

  it('handles a 5-row all-filled session by appending a trailing empty', () => {
    const sets: Partial<Set>[] = [
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
    ]
    enforceRowInvariants(sets)
    expect(sets).toEqual([
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
      { weight: 100 },
      {},
    ])
  })
})
