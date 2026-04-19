import { test, expect } from '@playwright/test'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'

// Test 2 relies on state from test 1. Serial mode ensures ordering.
test.describe.configure({ mode: 'serial' })

test.describe('Reorder exercises', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
      await seedExercise(page, 'Bench Press', 1)
      await seedExercise(page, 'Squat', 2)
      await seedExercise(page, 'Deadlift', 3)
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await expect(page).toHaveURL('/exercises')
  })

  test('dragged exercise appears in new position', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit' }).click()

    // Drag the "Deadlift" handle to the "Bench Press" item (drops before it)
    const deadliftHandle = page
      .locator('.exercise-item')
      .filter({ has: page.locator('.exercise-name', { hasText: 'Deadlift' }) })
      .locator('.drag-handle')

    const benchPressItem = page
      .locator('.exercise-item')
      .filter({ has: page.locator('.exercise-name', { hasText: 'Bench Press' }) })

    await deadliftHandle.dragTo(benchPressItem)

    // Verify new order: Deadlift, Bench Press, Squat
    const names = page.locator('.exercise-name')
    await expect(names.nth(0)).toHaveText('Deadlift')
    await expect(names.nth(1)).toHaveText('Bench Press')
    await expect(names.nth(2)).toHaveText('Squat')
  })

  test('reordered list persists after page reload', async ({ page }) => {
    await page.reload()
    await page.getByRole('button', { name: '(ungrouped)' }).click()

    const names = page.locator('.exercise-name')
    await expect(names.nth(0)).toHaveText('Deadlift')
    await expect(names.nth(1)).toHaveText('Bench Press')
    await expect(names.nth(2)).toHaveText('Squat')
  })
})
