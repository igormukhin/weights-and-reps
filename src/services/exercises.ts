import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Exercise } from '@/types'

function exercisesRef(uid: string) {
  return collection(db, 'users', uid, 'exercises')
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getExercises(uid: string): Promise<Exercise[]> {
  // Filter archived client-side to avoid needing a composite index
  // (where + orderBy on different fields requires one in Firestore).
  const snap = await getDocs(exercisesRef(uid))
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Exercise)
    .filter((e) => !e.archived)
    .sort((a, b) => a.position - b.position)
}

export async function getExerciseById(uid: string, id: string): Promise<Exercise | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'exercises', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Exercise
}

// ---------------------------------------------------------------------------
// Write (added in Phase 4 / T023)
// ---------------------------------------------------------------------------

export async function createExercise(uid: string, name: string, position: number): Promise<string> {
  const ref = await addDoc(exercisesRef(uid), {
    name,
    position,
    archived: false,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function renameExercise(uid: string, id: string, newName: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'exercises', id), { name: newName })
}

export async function archiveExercise(uid: string, id: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'exercises', id), { archived: true })
}

export async function updatePositions(
  uid: string,
  exercises: Pick<Exercise, 'id' | 'position'>[],
): Promise<void> {
  const batch = writeBatch(db)
  for (const ex of exercises) {
    batch.update(doc(db, 'users', uid, 'exercises', ex.id), { position: ex.position })
  }
  await batch.commit()
}
