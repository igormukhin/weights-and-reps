import { test, expect } from '@playwright/test'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'
import { seedSession, clearSessions, navigateToExercise } from '../fixtures/sessions'

// Selectors:
//   Delete FAB:         [data-testid="delete-session-fab"]
//   Dialog title:       text="Delete today's session?"
//   Dialog Delete btn:  role=button[name="Delete"]
//   Pump it button:     role=button[name="Pump it!"]
//   Set rows:           .set-row

test.describe.configure({ mode: 'serial' })

let exerciseId: string

// Today's date in YYYY-MM-DD (UTC)
const TODAY = new Date().toISOString().split('T')[0]

test.describe('Delete session', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
      exerciseId = await seedExercise(page, 'Barbell Row', 1)
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    // Re-seed today's session before each test so delete tests are independent
    await clearSessions(page, exerciseId)
    await seedSession(page, exerciseId, TODAY, [{ weight: 70, reps: 6 }])
    await navigateToExercise(page, exerciseId)
  })

  test('delete FAB is visible when a session exists', async ({ page }) => {
    await expect(page.locator('[data-testid="delete-session-fab"]')).toBeVisible()
  })

  test('clicking delete FAB shows confirmation dialog', async ({ page }) => {
    await page.locator('[data-testid="delete-session-fab"]').click()
    await expect(page.getByText("Delete today's session?")).toBeVisible()
  })

  test('confirming delete returns to read-only mode', async ({ page }) => {
    await page.locator('[data-testid="delete-session-fab"]').click()
    await page.getByRole('button', { name: 'Delete' }).click()

    // Edit mode gone, read-only mode restored
    await expect(page.locator('.set-row')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Pump it!' })).toBeVisible()
  })
})
