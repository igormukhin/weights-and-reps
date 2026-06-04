import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { ExerciseLog, SaveExerciseLogPayload } from '@/types'

function exerciseLogsRef(uid: string, exerciseId: string) {
  return collection(db, 'users', uid, 'exercises', exerciseId, 'exerciseLogs')
}

export async function getTodayExerciseLog(
  uid: string,
  exerciseId: string,
  dateStr: string,
): Promise<ExerciseLog | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'exercises', exerciseId, 'exerciseLogs', dateStr))
  if (!snap.exists()) return null
  return snap.data() as ExerciseLog
}

export async function getLastExerciseLog(
  uid: string,
  exerciseId: string,
  todayStr: string,
): Promise<ExerciseLog | null> {
  const logs = await getPastExerciseLogs(uid, exerciseId, todayStr, 1)
  return logs[0] ?? null
}

export async function getPastExerciseLogs(
  uid: string,
  exerciseId: string,
  todayStr: string,
  maxCount: number,
): Promise<ExerciseLog[]> {
  const q = query(
    exerciseLogsRef(uid, exerciseId),
    where('date', '<', todayStr),
    orderBy('date', 'desc'),
    limit(maxCount),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as ExerciseLog)
}

export async function saveExerciseLog(
  uid: string,
  exerciseId: string,
  payload: SaveExerciseLogPayload,
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, 'exercises', exerciseId, 'exerciseLogs', payload.date),
    {
      date: payload.date,
      sets: payload.sets,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function deleteExerciseLog(
  uid: string,
  exerciseId: string,
  dateStr: string,
): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'exercises', exerciseId, 'exerciseLogs', dateStr))
}
