import { test, expect } from '../fixtures'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'
import { clearExerciseLogs, navigateToExercise } from '../fixtures/exerciseLogs'

test.describe.configure({ mode: 'serial' })

test.describe('Exercise weight step', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
    } finally {
      await page.close()
    }
  })

  test('defaults to 2.5 kg even for dumbbell exercises (no name heuristic)', async ({ page }) => {
    await signInAsTestUser(page)
    const exerciseId = await seedExercise(page, 'Dumbbell Curl', 1)
    await clearExerciseLogs(page, exerciseId)
    await navigateToExercise(page, exerciseId)
    await page.getByRole('button', { name: 'Pump it!' }).click()

    const weightField = page.locator('.set-row').first().locator('.v-number-input').first()
    const weightInput = weightField.locator('input')
    const incrementBtn = weightField.locator('button').last()

    await weightInput.fill('10')
    await incrementBtn.click()

    await expect(weightInput).toHaveValue(/12[.,]5/)
  })

  test('adding an exercise with 1 kg weight step uses 1 kg increment and persists after reload', async ({ page }) => {
    await signInAsTestUser(page)
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.locator('[data-testid="add-exercise-fab"]').click()

    await page.getByLabel('Exercise name').fill('Lateral Raise')
    await page.locator('[data-testid="weight-step-1"]').click()
    await page.getByRole('button', { name: 'Add' }).click()

    await page.getByRole('button', { name: 'Done' }).click()
    const exerciseItem = page.locator('.exercise-name', { hasText: 'Lateral Raise' })
    await expect(exerciseItem).toBeVisible()
    await exerciseItem.click()

    await page.getByRole('button', { name: 'Pump it!' }).click()

    const weightField = page.locator('.set-row').first().locator('.v-number-input').first()
    const weightInput = weightField.locator('input')
    const incrementBtn = weightField.locator('button').last()

    await weightInput.fill('10')
    await incrementBtn.click()
    await expect(weightInput).toHaveValue(/^11([.,]0)?$/)

    // Manual decimal input remains unconstrained
    await weightInput.fill('13.5')
    await expect(weightInput).toHaveValue(/13[.,]5/)

    // Reload and verify 1 kg setting persisted
    await page.reload()
    await page.getByRole('button', { name: 'Rename exercise' }).click()
    await expect(page.locator('[data-testid="weight-step-1"]')).toHaveClass(/v-btn--active/)
  })

  test('editing weight step from Logging mode updates stepper immediately and persists', async ({ page }) => {
    await signInAsTestUser(page)
    const exerciseId = await seedExercise(page, 'Bench Press', 3)
    await clearExerciseLogs(page, exerciseId)
    await navigateToExercise(page, exerciseId)
    await page.getByRole('button', { name: 'Pump it!' }).click()

    const weightField = page.locator('.set-row').first().locator('.v-number-input').first()
    const weightInput = weightField.locator('input')
    const incrementBtn = weightField.locator('button').last()

    await weightInput.fill('20')
    await incrementBtn.click()
    await expect(weightInput).toHaveValue(/22[.,]5/)

    // Change weight step to 1 kg via app bar edit dialog while in Logging mode
    await page.getByRole('button', { name: 'Rename exercise' }).click()
    await page.locator('[data-testid="weight-step-1"]').click()
    await page.getByRole('button', { name: 'Save' }).click()

    // Increment immediately uses 1 kg
    await incrementBtn.click()
    await expect(weightInput).toHaveValue(/23[.,]5/)

    // Reload and confirm 1 kg persisted
    await page.reload()
    await page.getByRole('button', { name: 'Rename exercise' }).click()
    await expect(page.locator('[data-testid="weight-step-1"]')).toHaveClass(/v-btn--active/)
  })
})
