import type { Exercise } from '@/types'
import { useExercisesStore } from '@/stores/exercises'
import {
  createExercise,
  updateExercise as updateExerciseService,
  archiveExercise as archiveExerciseService,
  updatePositions,
} from '@/services/exercises'
import { findInsertPosition } from '@/utils/exercisePosition'

export function useExercises(uid: string) {
  const store = useExercisesStore()

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function isDuplicateName(name: string, category?: string, excludeId?: string): boolean {
    const normalisedName = name.trim().toLowerCase()
    const normalisedCat = (category || '').trim().toLowerCase()
    return store.exercises.some((e) => {
      if (e.id === excludeId) return false
      const exName = e.name.trim().toLowerCase()
      const exCat = (e.category || '').trim().toLowerCase()
      return exName === normalisedName && exCat === normalisedCat
    })
  }

  /**
   * Re-index all exercises starting from position 1, then batch write.
   * Called after any insertion or reorder.
   */
  async function reindexAndPersist(list: Exercise[]): Promise<void> {
    const reindexed = list.map((ex, i) => ({ ...ex, position: i + 1 }))
    store.exercises = reindexed
    await updatePositions(
      uid,
      reindexed.map((e) => ({ id: e.id, position: e.position })),
    )
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async function addExercise(name: string, category?: string): Promise<{ id?: string; error?: string }> {
    const trimmedName = name.trim()
    const trimmedCat = category?.trim() || undefined
    if (!trimmedName) return { error: 'Exercise name is required.' }
    if (isDuplicateName(trimmedName, trimmedCat)) {
      return { error: 'An exercise with this name and category already exists.' }
    }

    const insertAt = findInsertPosition(store.exercises, trimmedName, trimmedCat)

    // Shift all exercises at or after insertAt position up by 1
    const shifted = store.exercises.map((e) =>
      e.position >= insertAt ? { ...e, position: e.position + 1 } : e,
    )

    // Create the new exercise at the target position
    const id = await createExercise(uid, trimmedName, insertAt, trimmedCat)

    // Rebuild store list and re-index cleanly
    const newEx: Exercise = {
      id,
      name: trimmedName,
      category: trimmedCat,
      position: insertAt,
      archived: false,
      createdAt: null as unknown as Exercise['createdAt'], // filled by server
    }

    const merged = [...shifted, newEx].sort((a, b) => a.position - b.position)
    await reindexAndPersist(merged)
    return { id }
  }

  async function renameExercise(
    id: string,
    newName: string,
    newCategory?: string,
  ): Promise<{ error?: string }> {
    const trimmedName = newName.trim()
    const trimmedCat = newCategory?.trim() || undefined
    if (!trimmedName) return { error: 'Exercise name is required.' }

    // Duplicate check: case-insensitive, but exclude the exercise's own id
    if (isDuplicateName(trimmedName, trimmedCat, id)) {
      return { error: 'An exercise with this name and category already exists.' }
    }

    const ex = store.exercises.find((e) => e.id === id)
    if (!ex) return { error: 'Exercise not found.' }

    const catChanged = (ex.category || '') !== (trimmedCat || '')

    if (catChanged) {
      // Category changed -> remove from list, find new position in remaining list, shift, and reindex
      const remaining = store.exercises.filter((e) => e.id !== id)
      const insertAt = findInsertPosition(remaining, trimmedName, trimmedCat)

      const shifted = remaining.map((e) =>
        e.position >= insertAt ? { ...e, position: e.position + 1 } : e,
      )

      await updateExerciseService(uid, id, trimmedName, trimmedCat)

      ex.name = trimmedName
      ex.category = trimmedCat
      ex.position = insertAt

      const merged = [...shifted, ex].sort((a, b) => a.position - b.position)
      await reindexAndPersist(merged)
    } else {
      // Category didn't change -> simply rename the exercise
      await updateExerciseService(uid, id, trimmedName, trimmedCat)
      ex.name = trimmedName
    }

    return {}
  }

  async function archiveExercise(id: string): Promise<void> {
    await archiveExerciseService(uid, id)
    store.exercises = store.exercises.filter((e) => e.id !== id)
  }

  async function reorder(newList: Exercise[]): Promise<void> {
    await reindexAndPersist(newList)
  }

  return { addExercise, renameExercise, archiveExercise, reorder }
}
