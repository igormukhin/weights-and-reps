import { test, expect } from '../fixtures'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'

// Tests share suite-level state. Serial mode ensures ordering.
test.describe.configure({ mode: 'serial' })

test.describe('Exercise groups', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
      await seedExercise(page, 'Chest: Bench Press', 1)
      await seedExercise(page, 'Back: Pull-up', 2)
      await seedExercise(page, 'Chest: Incline Press', 3)
      await seedExercise(page, 'Plank', 4)
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await expect(page).toHaveURL('/exercises')
  })

  test('all groups are collapsed on load', async ({ page }) => {
    await expect(page.locator('.exercise-name', { hasText: 'Bench Press' })).not.toBeVisible()
    await expect(page.locator('.exercise-name', { hasText: 'Pull-up' })).not.toBeVisible()
    await expect(page.locator('.exercise-name', { hasText: 'Plank' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Chest' })).toBeVisible()
    await expect(page.getByRole('button', { name: '(ungrouped)' })).toBeVisible()
  })

  test('expanding a group shows short names only', async ({ page }) => {
    await page.getByRole('button', { name: 'Chest' }).click()
    await expect(page.locator('.exercise-name', { hasText: 'Bench Press' })).toBeVisible()
    await expect(page.locator('.exercise-name', { hasText: 'Incline Press' })).toBeVisible()
    await expect(page.locator('.exercise-name', { hasText: 'Chest: Bench Press' })).not.toBeVisible()
  })

  test('opening a second group collapses the first', async ({ page }) => {
    await page.getByRole('button', { name: 'Chest' }).click()
    await expect(page.locator('.exercise-name', { hasText: 'Bench Press' })).toBeVisible()

    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.locator('.exercise-name', { hasText: 'Pull-up' })).toBeVisible()
    await expect(page.locator('.exercise-name', { hasText: 'Bench Press' })).not.toBeVisible()
  })

  test('named groups appear alphabetically before ungrouped', async ({ page }) => {
    const panels = page.locator('.v-expansion-panel-title')
    await expect(panels.nth(0)).toContainText('Back')
    await expect(panels.nth(1)).toContainText('Chest')
    await expect(panels.nth(2)).toContainText('(ungrouped)')
  })

  test('ungrouped group contains exercises without colons', async ({ page }) => {
    await page.getByRole('button', { name: '(ungrouped)' }).click()
    await expect(page.locator('.exercise-name', { hasText: 'Plank' })).toBeVisible()
  })
})
