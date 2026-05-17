import type { Exercise } from '@/types'
import { useExercisesStore } from '@/stores/exercises'
import {
  createExercise,
  renameExercise as renameExerciseService,
  archiveExercise as archiveExerciseService,
  updatePositions,
} from '@/services/exercises'
import { findInsertPosition } from '@/utils/exercisePosition'

export function useExercises(uid: string) {
  const store = useExercisesStore()

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function isDuplicateName(name: string, excludeId?: string): boolean {
    const normalised = name.trim().toLowerCase()
    return store.exercises.some(
      (e) => e.name.toLowerCase() === normalised && e.id !== excludeId,
    )
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

  async function addExercise(name: string): Promise<{ id?: string; error?: string }> {
    const trimmed = name.trim()
    if (!trimmed) return { error: 'Exercise name is required.' }
    if (isDuplicateName(trimmed)) return { error: 'An exercise with this name already exists.' }

    const insertAt = findInsertPosition(store.exercises, trimmed)

    // Shift all exercises at or after insertAt position up by 1
    const shifted = store.exercises.map((e) =>
      e.position >= insertAt ? { ...e, position: e.position + 1 } : e,
    )

    // Create the new exercise at the target position
    const id = await createExercise(uid, trimmed, insertAt)

    // Rebuild store list and re-index cleanly
    const newEx: Exercise = {
      id,
      name: trimmed,
      position: insertAt,
      archived: false,
      createdAt: null as unknown as Exercise['createdAt'], // filled by server
    }

    const merged = [...shifted, newEx].sort((a, b) => a.position - b.position)
    await reindexAndPersist(merged)
    return { id }
  }

  async function renameExercise(id: string, newName: string): Promise<{ error?: string }> {
    const trimmed = newName.trim()
    if (!trimmed) return { error: 'Exercise name is required.' }

    // Duplicate check: case-insensitive, but exclude the exercise's own id
    if (isDuplicateName(trimmed, id)) {
      return { error: 'An exercise with this name already exists.' }
    }

    await renameExerciseService(uid, id, trimmed)
    // Update store locally
    const ex = store.exercises.find((e) => e.id === id)
    if (ex) ex.name = trimmed
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
