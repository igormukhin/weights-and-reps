import type { Timestamp } from 'firebase/firestore'

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

/** A single set within a training session. Embedded in Session.sets. */
export interface Set {
  /** Weight in kilograms. Minimum 0.5. Step: 2.5 kg. */
  weight: number
  /** Number of repetitions. Minimum 1. Step: 1. */
  reps: number
}

/** A training session for one exercise on one calendar date. */
export interface Session {
  /** Calendar date in YYYY-MM-DD format. Matches Firestore document ID. */
  date: string
  /** Ordered array of sets. Empty rows are never persisted. */
  sets: Set[]
  /** Timestamp of the last auto-save write. */
  updatedAt: Timestamp
}

/** An exercise belonging to a user. */
export interface Exercise {
  /** Firestore auto-generated document ID. */
  id: string
  /** Display name. Unique per user (case-insensitive). */
  name: string
  /** Integer display position (1-based). Re-indexed on every reorder/insert. */
  position: number
  /** True if the exercise has been hidden. One-way transition; no in-app restore. */
  hidden: boolean
  /** Server timestamp set once on creation. */
  createdAt: Timestamp
}

// ---------------------------------------------------------------------------
// Service layer interfaces
// ---------------------------------------------------------------------------

/** Payload for creating a new exercise. */
export interface CreateExercisePayload {
  name: string
}

/** Payload for renaming an existing exercise. */
export interface RenameExercisePayload {
  id: string
  newName: string
}

/** Payload for saving a session (auto-save). */
export interface SaveSessionPayload {
  exerciseId: string
  date: string // YYYY-MM-DD
  sets: Set[]
}

// ---------------------------------------------------------------------------
// UI / composable state types
// ---------------------------------------------------------------------------

/** Save status exposed by useSession composable. */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * State returned by useSession composable.
 * Drives the ExerciseDetailView.
 */
export interface SessionState {
  /** Today's set data (editable). Null if no session exists yet today. */
  todaySets: (Partial<Set> | null)[]
  /** Previous session's set data (read-only reference). Empty array if no history. */
  lastSets: Set[]
  /** Date of the last (previous) session, formatted DD.MM.YYYY. Empty string if none. */
  lastSessionDate: string
  /** Current auto-save status. */
  saveStatus: SaveStatus
  /** Error message when saveStatus is 'error'. Null otherwise. */
  saveError: string | null
}
