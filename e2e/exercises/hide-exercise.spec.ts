import { test, expect } from '../fixtures'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'

// Tests share suite-level emulator state. Serial mode ensures ordering.
test.describe.configure({ mode: 'serial' })

test.describe('Hide exercise', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
      await seedExercise(page, 'Squat', 1)
      await seedExercise(page, 'Pull-up', 2)
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await expect(page).toHaveURL('/exercises')
  })

  test('hidden exercise disappears from list', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit' }).click()

    const item = page
      .locator('.exercise-item')
      .filter({ has: page.locator('.exercise-name', { hasText: 'Squat' }) })
    await item.locator('[data-testid="hide-exercise-btn"]').click()

    await page.getByRole('button', { name: 'Hide' }).click()

    await expect(page.locator('.exercise-name', { hasText: 'Squat' })).not.toBeVisible()
    await expect(page.locator('.exercise-name', { hasText: 'Pull-up' })).toBeVisible()
  })

  test('hidden exercise stays hidden after page reload', async ({ page }) => {
    await page.reload()
    await expect(page.locator('.exercise-name', { hasText: 'Squat' })).not.toBeVisible()
  })

  test('cancel hide leaves exercise in list', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit' }).click()

    const item = page
      .locator('.exercise-item')
      .filter({ has: page.locator('.exercise-name', { hasText: 'Pull-up' }) })
    await item.locator('[data-testid="hide-exercise-btn"]').click()

    await page.getByRole('button', { name: 'Cancel' }).click()

    await expect(page.locator('.exercise-name', { hasText: 'Pull-up' })).toBeVisible()
  })
})
