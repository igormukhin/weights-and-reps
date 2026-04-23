import { test, expect } from '../fixtures'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'

// Test 2 relies on state from test 1 ("Bench Fly" is already in the list).
// Serial mode ensures ordering.
test.describe.configure({ mode: 'serial' })

test.describe('Add exercise ordering', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
      // Seed two exercises with clearly different prefixes
      await seedExercise(page, 'Bench Press', 1)
      await seedExercise(page, 'Squat', 2)
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await expect(page).toHaveURL('/exercises')
  })

  test('new exercise inserts after longest-prefix match', async ({ page }) => {
    // "Bench Fly" shares "bench " with "Bench Press" → should appear right after it
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.locator('[data-testid="add-exercise-fab"]').click()
    await page.getByLabel('Exercise name').fill('Bench Fly')
    await page.getByRole('button', { name: 'Add' }).click()

    // Wait for dialog to close and list to update
    await expect(page.locator('.exercise-name', { hasText: 'Bench Fly' })).toBeVisible()

    // Verify order: Bench Press (0), Bench Fly (1), Squat (2)
    const names = page.locator('.exercise-name')
    await expect(names.nth(0)).toHaveText('Bench Press')
    await expect(names.nth(1)).toHaveText('Bench Fly')
    await expect(names.nth(2)).toHaveText('Squat')
  })

  test('new exercise with no prefix match appends to end', async ({ page }) => {
    // "Overhead Press" shares no prefix with "Bench Press", "Bench Fly", or "Squat"
    // → falls back to end of list
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.locator('[data-testid="add-exercise-fab"]').click()
    await page.getByLabel('Exercise name').fill('Overhead Press')
    await page.getByRole('button', { name: 'Add' }).click()

    await expect(page.locator('.exercise-name', { hasText: 'Overhead Press' })).toBeVisible()

    // Verify order: Bench Press (0), Bench Fly (1), Squat (2), Overhead Press (3)
    const names = page.locator('.exercise-name')
    await expect(names.nth(0)).toHaveText('Bench Press')
    await expect(names.nth(1)).toHaveText('Bench Fly')
    await expect(names.nth(2)).toHaveText('Squat')
    await expect(names.nth(3)).toHaveText('Overhead Press')
  })
})
