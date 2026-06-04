import type { Timestamp } from 'firebase/firestore'

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

/** A single set within an ExerciseLog. Embedded in ExerciseLog.sets. */
export interface Set {
  /** Weight in kilograms. Negative values represent assisted exercises. Step: 2.5 kg. */
  weight: number
  /** Number of repetitions. Minimum 1. Step: 1. Optional — a set with weight only is valid. */
  reps?: number
  /** BumpIt label. True if the user marked this set for a weight bump next time they train this exercise. Absent = false. */
  bumpIt?: boolean
}

/** The record of all sets performed for one exercise on one calendar date. */
export interface ExerciseLog {
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
  /** The exercise category (e.g. Chest, Back). Optional if ungrouped. */
  category?: string
  /** Integer display position (1-based). Re-indexed on every reorder/insert. */
  position: number
  /** True if the exercise has been archived. One-way transition; no in-app restore. */
  archived: boolean
  /** Server timestamp set once on creation. */
  createdAt: Timestamp
}

// ---------------------------------------------------------------------------
// Service layer interfaces
// ---------------------------------------------------------------------------

/** Payload for creating a new exercise. */
export interface CreateExercisePayload {
  name: string
  category?: string
}

/** Payload for updating an existing exercise. */
export interface UpdateExercisePayload {
  id: string
  name: string
  category?: string
}

/** Payload for saving an ExerciseLog (auto-save). */
export interface SaveExerciseLogPayload {
  exerciseId: string
  date: string // YYYY-MM-DD
  sets: Set[]
}

// ---------------------------------------------------------------------------
// UI / composable state types
// ---------------------------------------------------------------------------

/** Save status exposed by useExerciseLog composable. */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * State returned by useExerciseLog composable.
 * Drives the ExerciseDetailView.
 */
export interface ExerciseLogState {
  /** Today's set data (editable). Null if no ExerciseLog exists yet today. */
  todaySets: (Partial<Set> | null)[]
  /** Previous ExerciseLog's set data (read-only reference). Empty array if no history. */
  lastSets: Set[]
  /** Date of the last ExerciseLog, formatted DD.MM.YYYY. Empty string if none. */
  lastExerciseLogDate: string
  /** Last Past ExerciseLogs for the Exercise, newest first. */
  pastExerciseLogs: ExerciseLog[]
  /** Current auto-save status. */
  saveStatus: SaveStatus
  /** Error message when saveStatus is 'error'. Null otherwise. */
  saveError: string | null
}
