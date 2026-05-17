import { test, expect } from '../fixtures'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'
import { seedExerciseLog, clearExerciseLogs, navigateToExercise } from '../fixtures/exerciseLogs'

// Selectors:
//   Pump it button:  role=button[name="Pump it!"]
//   Set rows:        .set-row
//   Weight input:    .set-row >> nth=0 >> input >> nth=0
//   Reps input:      .set-row >> nth=0 >> input >> nth=1
//   Save complete:   [data-save-status="saved"]

test.describe.configure({ mode: 'serial' })

const PAST_DATE = '2020-01-15'
const PAST_SETS = [
  { weight: 80, reps: 8 },
  { weight: 75, reps: 10 },
]

let exerciseId: string

test.describe('Logging mode', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
      exerciseId = await seedExercise(page, 'Squat', 1)
      await clearExerciseLogs(page, exerciseId)
      await seedExerciseLog(page, exerciseId, PAST_DATE, PAST_SETS)
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await navigateToExercise(page, exerciseId)
  })

  test('"Pump it!" enters edit mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Pump it!' }).click()
    await expect(page.locator('.set-row').first()).toBeVisible()
  })

  test('set rows are pre-filled with last ExerciseLog values', async ({ page }) => {
    await page.getByRole('button', { name: 'Pump it!' }).click()

    const firstRow = page.locator('.set-row').nth(0)
    const weightInput = firstRow.locator('input').nth(0)
    const repsInput = firstRow.locator('input').nth(1)

    // Values from PAST_SETS[0]: weight=80, reps=8
    await expect(weightInput).toHaveValue(/80/)
    await expect(repsInput).toHaveValue(/8/)
  })

  test('pre-filled data persists after save and reload', async ({ page }) => {
    // Serial: this test runs after the others; today's ExerciseLog may or may not exist.
    // Wait for loading to settle (either "Pump it!" or set rows will appear).
    const pumpItBtn = page.getByRole('button', { name: 'Pump it!' })
    const firstSetRow = page.locator('.set-row').first()
    await expect(pumpItBtn.or(firstSetRow)).toBeVisible({ timeout: 10_000 })

    if (await pumpItBtn.isVisible()) {
      await pumpItBtn.click()
    }

    const firstRow = page.locator('.set-row').nth(0)
    const weightInput = firstRow.locator('input').nth(0)

    // Make an edit to trigger auto-save
    await weightInput.fill('85')
    await weightInput.blur()

    // Wait for auto-save (2-second debounce + write)
    await expect(page.locator('[data-save-status="saved"]')).toBeAttached({ timeout: 10_000 })

    await page.reload()
    await page.waitForURL(`/exercises/${exerciseId}`)

    const reloadedWeightInput = page.locator('.set-row').nth(0).locator('input').nth(0)
    await expect(reloadedWeightInput).toHaveValue(/85/)
  })
})
