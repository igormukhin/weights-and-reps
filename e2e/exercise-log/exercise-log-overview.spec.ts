import { test, expect } from '../fixtures'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'
import { seedExerciseLog, clearExerciseLogs, navigateToExercise } from '../fixtures/exerciseLogs'

// Selectors:
//   Last training date:  text matching 'Last training:' paragraph
//   Set table rows:      table tbody tr  (read-only ExerciseLog table)
//   Pump it button:      role=button[name="Pump it!"]

test.describe.configure({ mode: 'serial' })

const PAST_DATE = '2020-01-15'
const PAST_SETS = [
  { weight: 80, reps: 8 },
  { weight: 80, reps: 7 },
]

let exerciseId: string

test.describe('Overview mode', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
      exerciseId = await seedExercise(page, 'Bench Press', 1)
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

  test('shows last training date', async ({ page }) => {
    await expect(page.locator('text=Last training:')).toBeVisible()
  })

  test('shows last ExerciseLog sets in the table', async ({ page }) => {
    const rows = page.locator('table tbody tr')
    await expect(rows).toHaveCount(2)
    // First row: weight 80.0 kg and 8 reps
    await expect(rows.nth(0)).toContainText('80')
    await expect(rows.nth(0)).toContainText('8')
  })

  test('"Pump it!" button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Pump it!' })).toBeVisible()
  })
})
