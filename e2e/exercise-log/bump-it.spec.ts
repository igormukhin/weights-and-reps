import { test, expect } from '../fixtures'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'
import { clearExerciseLogs, navigateToExercise } from '../fixtures/exerciseLogs'

// Selectors:
//   BumpIt button:   button containing '🆙' inside .set-row
//   Weight input:    first input in .set-row (needed to trigger save alongside bumpIt toggle)
//   Save complete:   [data-save-status="saved"]

test.describe.configure({ mode: 'serial' })

let exerciseId: string

test.describe('BumpIt toggle', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
      exerciseId = await seedExercise(page, 'Overhead Press', 1)
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await clearExerciseLogs(page, exerciseId)
    await navigateToExercise(page, exerciseId)
    await page.getByRole('button', { name: 'Pump it!' }).click()
    await expect(page.locator('.set-row').first()).toBeVisible()
  })

  test('BumpIt button starts inactive (opacity 0.25)', async ({ page }) => {
    const bumpItBtn = page.locator('.set-row').nth(0).getByRole('button', { name: '🆙' })
    await expect(bumpItBtn).toHaveCSS('opacity', '0.25')
  })

  test('clicking BumpIt activates it (opacity 1)', async ({ page }) => {
    const bumpItBtn = page.locator('.set-row').nth(0).getByRole('button', { name: '🆙' })
    await bumpItBtn.click()
    await expect(bumpItBtn).toHaveCSS('opacity', '1')
  })

  test('BumpIt state persists after save and reload', async ({ page }) => {
    // Set a weight to make the ExerciseLog saveable, then toggle BumpIt
    const weightInput = page.locator('.set-row').nth(0).locator('input').nth(0)
    await weightInput.fill('60')
    await weightInput.blur()

    const bumpItBtn = page.locator('.set-row').nth(0).getByRole('button', { name: '🆙' })
    await bumpItBtn.click()

    await expect(page.locator('[data-save-status="saved"]')).toBeAttached({ timeout: 10_000 })

    await page.reload()
    await page.waitForURL(`/exercises/${exerciseId}`)

    await expect(
      page.locator('.set-row').nth(0).getByRole('button', { name: '🆙' }),
    ).toHaveCSS('opacity', '1')
  })
})
