import { test, expect } from '../fixtures'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'
import { clearExerciseLogs, navigateToExercise } from '../fixtures/exerciseLogs'

// Selectors:
//   Set rows:        .set-row
//   Weight input:    first input inside a .set-row
//   Save complete:   [data-save-status="saved"]

test.describe.configure({ mode: 'serial' })

let exerciseId: string

test.describe('Edit sets', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
      exerciseId = await seedExercise(page, 'Deadlift', 1)
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    // Clear ExerciseLogs so each test starts in read-only mode with "Pump it!" visible
    await clearExerciseLogs(page, exerciseId)
    await navigateToExercise(page, exerciseId)
    await page.getByRole('button', { name: 'Pump it!' }).click()
    await expect(page.locator('.set-row').first()).toBeVisible()
  })

  test('typing weight in the last row auto-appends an empty row', async ({ page }) => {
    const initialCount = await page.locator('.set-row').count()
    const lastWeightInput = page.locator('.set-row').nth(initialCount - 1).locator('input').nth(0)
    await lastWeightInput.fill('100')
    await expect(page.locator('.set-row')).toHaveCount(initialCount + 1)
  })

  test('editing weight triggers auto-save', async ({ page }) => {
    const weightInput = page.locator('.set-row').nth(0).locator('input').nth(0)
    await weightInput.fill('100')
    await weightInput.blur()

    // Auto-save has a 2-second debounce; wait up to 10s for save to complete
    await expect(page.locator('[data-save-status="saved"]')).toBeAttached({ timeout: 10_000 })
  })

  test('edited weight persists after reload', async ({ page }) => {
    const weightInput = page.locator('.set-row').nth(0).locator('input').nth(0)
    await weightInput.fill('100')
    await weightInput.blur()
    await expect(page.locator('[data-save-status="saved"]')).toBeAttached({ timeout: 10_000 })

    await page.reload()
    await page.waitForURL(`/exercises/${exerciseId}`)

    await expect(page.locator('.set-row').nth(0).locator('input').nth(0)).toHaveValue(/100/)
  })
})
