import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from './firebase'

const provider = new GoogleAuthProvider()

export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(auth, provider)
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
  return firebaseOnAuthStateChanged(auth, callback)
}

/**
 * Resolves once Firebase has determined the initial auth state.
 * Use this to block router navigation until auth is ready.
 */
export const authReady: Promise<User | null> = auth.authStateReady().then(() => auth.currentUser)
