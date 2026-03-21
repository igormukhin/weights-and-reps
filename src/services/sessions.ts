import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Session, SaveSessionPayload } from '@/types'

function sessionsRef(uid: string, exerciseId: string) {
  return collection(db, 'users', uid, 'exercises', exerciseId, 'sessions')
}

export async function getTodaySession(
  uid: string,
  exerciseId: string,
  dateStr: string,
): Promise<Session | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'exercises', exerciseId, 'sessions', dateStr))
  if (!snap.exists()) return null
  return snap.data() as Session
}

export async function getLastSession(
  uid: string,
  exerciseId: string,
  todayStr: string,
): Promise<Session | null> {
  const q = query(sessionsRef(uid, exerciseId), orderBy('date', 'desc'), limit(2))
  const snap = await getDocs(q)
  const docs = snap.docs.map((d) => d.data() as Session)

  // If first result is today, last session is the second result
  if (docs.length === 0) return null
  if (docs[0].date === todayStr) return docs[1] ?? null
  return docs[0]
}

export async function saveSession(
  uid: string,
  exerciseId: string,
  payload: SaveSessionPayload,
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, 'exercises', exerciseId, 'sessions', payload.date),
    {
      date: payload.date,
      sets: payload.sets,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function deleteSession(
  uid: string,
  exerciseId: string,
  dateStr: string,
): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'exercises', exerciseId, 'sessions', dateStr))
}
