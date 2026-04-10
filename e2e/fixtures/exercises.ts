import type { Page } from '@playwright/test'

type WindowE2E = {
  __e2eAuth: { currentUser: { uid: string } }
  __e2eDb: unknown
  __e2eAddDoc: (ref: unknown, data: unknown) => Promise<unknown>
  __e2eCollection: (db: unknown, ...segments: string[]) => unknown
  __e2eServerTimestamp: () => unknown
}

/**
 * Deletes all exercise documents for the current user from the Firestore emulator.
 *
 * Prerequisites: signInAsTestUser(page) must have been called first.
 * Call this in beforeAll before seeding to ensure a clean slate.
 *
 * Note: does not delete sub-collections (e.g. sessions) — only top-level exercise docs.
 */
export async function clearExercises(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const w = window as unknown as { __e2eClearExercises?: () => Promise<void> }
    if (!w.__e2eClearExercises) {
      throw new Error('clearExercises: __e2eClearExercises not found — ensure emulator build')
    }
    await w.__e2eClearExercises()
  })
}

/**
 * Writes an exercise document directly into the Firestore emulator.
 * Returns the new exercise document ID.
 *
 * Prerequisites: signInAsTestUser(page) must have been called first so that
 * (a) the Firebase SDK is initialised, (b) the window.__e2e* helpers are
 * available, and (c) auth.currentUser is set.
 */
export async function seedExercise(page: Page, name: string, position: number): Promise<string> {
  return await page.evaluate(
    async ([exerciseName, exercisePosition]) => {
      const w = window as unknown as WindowE2E
      const uid = w.__e2eAuth.currentUser?.uid
      if (!uid) throw new Error('seedExercise: no authenticated user — call signInAsTestUser first')
      const ref = w.__e2eCollection(w.__e2eDb, 'users', uid, 'exercises')
      const docRef = await w.__e2eAddDoc(ref, {
        name: exerciseName,
        position: exercisePosition,
        hidden: false,
        createdAt: w.__e2eServerTimestamp(),
      })
      return (docRef as { id: string }).id
    },
    [name, position] as [string, number],
  )
}
