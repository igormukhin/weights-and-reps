import { test, expect } from '@playwright/test'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises } from '../fixtures/exercises'

// Selectors:
//   Edit button:          role=button[name="Edit"]         (AppBar, toggles edit mode)
//   Add exercise FAB:     [data-testid="add-exercise-fab"] (fixed FAB, visible in edit mode)
//   Exercise name input:  getByLabel('Exercise name')      (v-text-field in AddExerciseDialog)
//   Add submit button:    role=button[name="Add"]          (v-card-actions in AddExerciseDialog)
//   Exercise list items:  .exercise-name                   (v-list-item-title in ExerciseListItem)

// Tests share suite-level emulator state: test 2 relies on the exercise added in test 1.
// Serial mode ensures they run in order within a single browser context lifecycle.
test.describe.configure({ mode: 'serial' })

test.describe('Add exercise', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    // Should already be on /exercises after sign-in
    await expect(page).toHaveURL('/exercises')
  })

  test('added exercise appears in the list', async ({ page }) => {
    // Enter edit mode to reveal the add-exercise FAB
    await page.getByRole('button', { name: 'Edit' }).click()

    // Open the Add Exercise dialog
    await page.locator('[data-testid="add-exercise-fab"]').click()

    // Fill in the exercise name and submit
    await page.getByLabel('Exercise name').fill('Bench Press')
    await page.getByRole('button', { name: 'Add' }).click()

    // Exercise should appear in the list without a page refresh
    await expect(page.locator('.exercise-name', { hasText: 'Bench Press' })).toBeVisible()
  })

  test('added exercise persists after page reload', async ({ page }) => {
    // Relies on suite-level state: "Bench Press" was added in the previous test.
    // Serial mode (above) guarantees this test runs after the first.
    await page.reload()
    // Wait for the exercise list to render (avoids networkidle which never fires due to Firestore WebSocket)
    await expect(page.locator('.exercise-name', { hasText: 'Bench Press' })).toBeVisible()
  })
})
