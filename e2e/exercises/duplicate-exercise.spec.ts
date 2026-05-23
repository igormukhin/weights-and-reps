import { test, expect } from '../fixtures'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'

test.describe.configure({ mode: 'serial' })

test.describe('Duplicate exercise validation', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
      // Seed initial exercises to test duplicates against
      await seedExercise(page, 'Chest: Bench Press', 1)
      await seedExercise(page, 'Plank', 2) // ungrouped
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await expect(page).toHaveURL('/exercises')
  })

  test('prevent adding duplicate exercise in the same category', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.locator('[data-testid="add-exercise-fab"]').click()

    // Try adding "Bench Press" in "Chest" again
    await page.getByLabel('Exercise name').fill('Bench Press')
    await page.getByRole('combobox', { name: 'Category (optional)' }).fill('Chest')
    await page.getByRole('button', { name: 'Add' }).click()

    // Assert duplicate error message is visible
    await expect(
      page.getByText('An exercise with this name and category already exists.'),
    ).toBeVisible()

    // Clean up: click Cancel
    await page.getByRole('button', { name: 'Cancel' }).click()
  })

  test('allow adding exercise with same name in a different category', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.locator('[data-testid="add-exercise-fab"]').click()

    // Add "Bench Press" in a different category "Home"
    await page.getByLabel('Exercise name').fill('Bench Press')
    await page.getByRole('combobox', { name: 'Category (optional)' }).fill('Home')
    await page.getByRole('button', { name: 'Add' }).click()

    // Go out of edit mode to check
    await page.getByRole('button', { name: 'Done' }).click()
    await page.getByRole('button', { name: 'Home' }).click()
    await expect(page.locator('.exercise-name', { hasText: 'Bench Press' })).toBeVisible()
  })

  test('prevent renaming/editing exercise to cause a duplicate', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit' }).click()

    // Let's find "Bench Press" under "Home" and try renaming it to "Bench Press" under "Chest"
    const item = page
      .locator('.exercise-item')
      .filter({ has: page.getByText('Home: Bench Press', { exact: true }) })
    await item.locator('[data-testid="rename-exercise-btn"]').click()

    // Change category to "Chest"
    await page.getByRole('combobox', { name: 'Category (optional)' }).fill('Chest')
    await page.getByRole('button', { name: 'Save' }).click()

    // Assert duplicate error message is visible
    await expect(
      page.getByText('An exercise with this name and category already exists.'),
    ).toBeVisible()

    // Clean up: click Cancel
    await page.getByRole('button', { name: 'Cancel' }).click()
  })
})
