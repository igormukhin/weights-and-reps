import type { Page } from '@playwright/test'
import type { Auth } from 'firebase/auth'

export const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
}

/**
 * Signs in as the test user via the Firebase Auth Emulator.
 *
 * Uses window.__e2eAuth and window.__e2eSignIn exposed by src/services/firebase.ts
 * when VITE_USE_FIREBASE_EMULATOR=true. Auth state is persisted in IndexedDB so it
 * survives the subsequent page.goto('/exercises') reload.
 */
export async function signInAsTestUser(page: Page): Promise<void> {
  // Load the app so the Firebase SDK initializes and exposes helpers on window
  await page.goto('/login')
  await page.waitForSelector('text=Sign in with Google')

  await page.evaluate(
    async ([email, password]) => {
      const auth = (window as unknown as Record<string, unknown>).__e2eAuth as Auth
      const signIn = (window as unknown as Record<string, unknown>).__e2eSignIn as (
        auth: Auth,
        email: string,
        password: string,
      ) => Promise<unknown>
      if (!auth || !signIn) {
        throw new Error(
          'Firebase auth helpers not found on window. ' +
            'Ensure the app was built with VITE_USE_FIREBASE_EMULATOR=true.',
        )
      }
      await signIn(auth, email, password)
    },
    [TEST_USER.email, TEST_USER.password],
  )

  // Auth state is now persisted — navigate to exercises (router guard will pass)
  await page.goto('/exercises')
  await page.waitForURL('/exercises')
}
