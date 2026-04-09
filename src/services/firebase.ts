import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  memoryLocalCache,
  connectFirestoreEmulator,
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  deleteDoc,
} from 'firebase/firestore'
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'

const app = initializeApp(firebaseConfig)

export const db = initializeFirestore(app, {
  localCache: useEmulator ? memoryLocalCache() : persistentLocalCache(),
})
export const auth = getAuth(app)

if (useEmulator) {
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectAuthEmulator(auth, 'http://localhost:9099')
  // Expose for E2E test automation — allows page.evaluate() to sign in programmatically
  ;(window as unknown as Record<string, unknown>).__e2eAuth = auth
  ;(window as unknown as Record<string, unknown>).__e2eSignIn = signInWithEmailAndPassword
  // Expose for E2E fixture seeding — allows page.evaluate() to write Firestore documents
  ;(window as unknown as Record<string, unknown>).__e2eDb = db
  ;(window as unknown as Record<string, unknown>).__e2eAddDoc = addDoc
  ;(window as unknown as Record<string, unknown>).__e2eCollection = collection
  ;(window as unknown as Record<string, unknown>).__e2eServerTimestamp = serverTimestamp
  const clearExercises = async (): Promise<void> => {
    if (!auth.currentUser) return
    const uid = auth.currentUser.uid
    const snap = await getDocs(collection(db, 'users', uid, 'exercises'))
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
  }
  ;(window as unknown as Record<string, unknown>).__e2eClearExercises = clearExercises
}
