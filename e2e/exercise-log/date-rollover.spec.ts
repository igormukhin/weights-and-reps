import { test, expect } from '../fixtures'
import type { Page } from '@playwright/test'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'
import { clearExerciseLogs, navigateToExercise } from '../fixtures/exerciseLogs'

test.describe.configure({ mode: 'serial' })

function localNoon(daysFromToday = 0): Date {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + daysFromToday)
  return date
}

async function browserTodayISO(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
}

function formatGermanDate(isoDateStr: string): string {
  const [year, month, day] = isoDateStr.split('-')
  return `${day}.${month}.${year}`
}

async function resumeTwoDaysLater(page: Page, startTime: Date): Promise<void> {
  const resumedTime = new Date(startTime)
  resumedTime.setDate(resumedTime.getDate() + 2)
  await page.clock.setFixedTime(resumedTime)
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
}

test.describe('ExerciseLog date rollover', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(localNoon())
    await signInAsTestUser(page)
    await clearExercises(page)
  })

  test('restored tab opens Overview mode when the old ExerciseLog was already persisted', async ({ page }) => {
    const startTime = localNoon()
    await page.clock.setFixedTime(startTime)
    const originalDate = await browserTodayISO(page)

    const exerciseId = await seedExercise(page, 'Rollover Press', 1)
    await clearExerciseLogs(page, exerciseId)
    await navigateToExercise(page, exerciseId)

    await page.getByRole('button', { name: 'Pump it!' }).click()
    await page.locator('.set-row').nth(0).locator('input').nth(0).fill('100')
    await expect(page.locator('[data-save-status="saved"]')).toBeAttached({ timeout: 10_000 })

    await resumeTwoDaysLater(page, startTime)

    await expect(page.getByRole('button', { name: 'Pump it!' })).toBeVisible()
    await expect(page.locator('.set-row')).toHaveCount(0)
    await expect(page.getByText(`Last training: ${formatGermanDate(originalDate)}`)).toBeVisible()
    await expect(page.getByTestId('last-exercise-log-table')).toContainText('100')
  })

  test('restored tab saves pending edits to the original date before opening Overview mode', async ({ page }) => {
    const startTime = localNoon()
    await page.clock.setFixedTime(startTime)
    const originalDate = await browserTodayISO(page)

    const exerciseId = await seedExercise(page, 'Pending Rollover Row', 1)
    await clearExerciseLogs(page, exerciseId)
    await navigateToExercise(page, exerciseId)

    await page.getByRole('button', { name: 'Pump it!' }).click()
    await page.locator('.set-row').nth(0).locator('input').nth(0).fill('105')

    await resumeTwoDaysLater(page, startTime)

    await expect(page.getByRole('button', { name: 'Pump it!' })).toBeVisible()
    await expect(page.locator('.set-row')).toHaveCount(0)
    await expect(page.getByText(`Last training: ${formatGermanDate(originalDate)}`)).toBeVisible()
    await expect(page.getByTestId('last-exercise-log-table')).toContainText('105')
  })
})
