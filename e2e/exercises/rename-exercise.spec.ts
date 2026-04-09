import { test, expect } from '@playwright/test'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'

// Tests share suite-level emulator state (test 1 renames the exercise; tests 2–3 rely on that).
// Serial mode ensures they run in order within a single browser context lifecycle.
test.describe.configure({ mode: 'serial' })

test.describe('Rename exercise', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
      await seedExercise(page, 'Deadlift', 1)
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await expect(page).toHaveURL('/exercises')
  })

  test('renamed exercise appears in list', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit' }).click()

    // Scope to the list item containing exactly "Deadlift" to avoid matching
    // "Romanian Deadlift" after rename
    const item = page
      .locator('.exercise-item')
      .filter({ has: page.getByText('Deadlift', { exact: true }) })
    await item.locator('[data-testid="rename-exercise-btn"]').click()

    await page.getByLabel('Exercise name').fill('Romanian Deadlift')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.locator('.exercise-name', { hasText: 'Romanian Deadlift' })).toBeVisible()
    // "Deadlift" as exact text should no longer exist — "Romanian Deadlift" is a different string
    await expect(page.locator('.exercise-name').getByText('Deadlift', { exact: true })).not.toBeVisible()
  })

  test('renamed exercise persists after page reload', async ({ page }) => {
    await page.reload()
    await expect(page.locator('.exercise-name', { hasText: 'Romanian Deadlift' })).toBeVisible()
  })

  test('cancel rename leaves exercise name unchanged', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit' }).click()

    const item = page
      .locator('.exercise-item')
      .filter({ has: page.locator('.exercise-name', { hasText: 'Romanian Deadlift' }) })
    await item.locator('[data-testid="rename-exercise-btn"]').click()

    await page.getByLabel('Exercise name').fill('Something Else')
    await page.getByRole('button', { name: 'Cancel' }).click()

    await expect(page.locator('.exercise-name', { hasText: 'Romanian Deadlift' })).toBeVisible()
    await expect(page.locator('.exercise-name', { hasText: 'Something Else' })).not.toBeVisible()
  })
})
