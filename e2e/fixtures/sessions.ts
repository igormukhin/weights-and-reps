import type { Page } from '@playwright/test'

type WindowE2E = {
  __e2eAuth: { currentUser: { uid: string } }
  __e2eDb: unknown
  __e2eSetDoc: (ref: unknown, data: unknown) => Promise<void>
  __e2eDoc: (db: unknown, ...segments: string[]) => unknown
  __e2eServerTimestamp: () => unknown
  __e2eClearExerciseLogs: (exerciseId: string) => Promise<void>
}

export interface SeedSet {
  weight: number
  reps: number
  bumpIt?: boolean
}

/**
 * Writes an ExerciseLog document directly into the Firestore emulator.
 *
 * Prerequisites: signInAsTestUser(page) must have been called first.
 */
export async function seedSession(
  page: Page,
  exerciseId: string,
  dateStr: string,
  sets: SeedSet[],
): Promise<void> {
  await page.evaluate(
    async ([exId, date, sessionSets]) => {
      const w = window as unknown as WindowE2E
      const uid = w.__e2eAuth.currentUser?.uid
      if (!uid) throw new Error('seedSession: no authenticated user — call signInAsTestUser first')
      const ref = w.__e2eDoc(w.__e2eDb, 'users', uid, 'exercises', exId, 'exerciseLogs', date)
      await w.__e2eSetDoc(ref, {
        date,
        sets: sessionSets,
        updatedAt: w.__e2eServerTimestamp(),
      })
    },
    [exerciseId, dateStr, sets] as [string, string, SeedSet[]],
  )
}

/**
 * Deletes all ExerciseLog documents for the given exercise from the Firestore emulator.
 *
 * Prerequisites: signInAsTestUser(page) must have been called first.
 */
export async function clearSessions(page: Page, exerciseId: string): Promise<void> {
  await page.evaluate(async (exId) => {
    const w = window as unknown as { __e2eClearExerciseLogs?: (id: string) => Promise<void> }
    if (!w.__e2eClearExerciseLogs) {
      throw new Error('clearSessions: __e2eClearExerciseLogs not found — ensure emulator build')
    }
    await w.__e2eClearExerciseLogs(exId)
  }, exerciseId)
}

/**
 * Navigates to the exercise detail page and waits for the URL to settle.
 * Each test's own assertions handle waiting for specific content.
 */
export async function navigateToExercise(page: Page, exerciseId: string): Promise<void> {
  await page.goto(`/exercises/${exerciseId}`)
  await page.waitForURL(`/exercises/${exerciseId}`)
}
