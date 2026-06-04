import { test, expect } from '../fixtures'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'
import { seedExerciseLog, clearExerciseLogs, navigateToExercise } from '../fixtures/exerciseLogs'

// Selectors:
//   Last training date:  text matching 'Last training:' paragraph
//   Set table rows:      data-testid=last-exercise-log-table tbody tr
//   History table rows:  data-testid=past-exercise-logs-table tbody tr
//   Pump it button:      role=button[name="Pump it!"]

test.describe.configure({ mode: 'serial' })

const PAST_SETS = [
  { weight: 80, reps: 8 },
  { weight: 82.5, reps: 7 },
]

let exerciseId: string

function isoDaysAgo(days: number): string {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() - days)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatGermanDate(isoDateStr: string): string {
  const [year, month, day] = isoDateStr.split('-')
  return `${day}.${month}.${year}`
}

test.describe('Overview mode', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
      exerciseId = await seedExercise(page, 'Bench Press', 1)
      await clearExerciseLogs(page, exerciseId)
      await seedExerciseLog(page, exerciseId, isoDaysAgo(1), PAST_SETS)
      await seedExerciseLog(page, exerciseId, isoDaysAgo(3), [])
      await seedExerciseLog(page, exerciseId, isoDaysAgo(7), [{ weight: 77.5, reps: 8 }])
      await seedExerciseLog(page, exerciseId, isoDaysAgo(14), [{ weight: 80, reps: 6 }])
      await seedExerciseLog(page, exerciseId, isoDaysAgo(30), [{ weight: 85, reps: 5 }])
      await seedExerciseLog(page, exerciseId, isoDaysAgo(31), [{ weight: 90, reps: 4 }])
      await seedExerciseLog(page, exerciseId, isoDaysAgo(45), [{ weight: 95, reps: 3 }])
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
    const rows = page.getByTestId('last-exercise-log-table').locator('tbody tr')
    await expect(rows).toHaveCount(2)
    await expect(rows.nth(0)).toContainText('80')
    await expect(rows.nth(0)).toContainText('8')
  })

  test('shows last 6 Past ExerciseLogs newest first', async ({ page }) => {
    const table = page.getByTestId('past-exercise-logs-table')
    const rows = table.locator('tbody tr')

    await expect(table.locator('thead')).toContainText('When')
    await expect(table.locator('thead')).toContainText('Weight')
    await expect(rows).toHaveCount(6)

    await expect(rows.nth(0).locator('td').nth(0)).toHaveText('1 day ago')
    await expect(rows.nth(0).locator('td').nth(1)).toHaveText('82,5 kg')
    await expect(rows.nth(1).locator('td').nth(0)).toHaveText('3 days ago')
    await expect(rows.nth(1).locator('td').nth(1)).toHaveText('-')
    await expect(rows.nth(4).locator('td').nth(0)).toHaveText('30 days ago')
    await expect(rows.nth(5).locator('td').nth(0)).toHaveText(formatGermanDate(isoDaysAgo(31)))
    await expect(table).not.toContainText(formatGermanDate(isoDaysAgo(45)))
  })

  test('"Pump it!" button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Pump it!' })).toBeVisible()
  })
})
