import { test, expect } from '../fixtures'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'

// Tests share suite-level state and rely on sessionStorage surviving within a browser context. Serial mode ensures ordering.
test.describe.configure({ mode: 'serial' })

let chestBenchId: string
let chestInclineId: string

test.describe('Last selected exercise', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
      chestBenchId = await seedExercise(page, 'Chest: Bench Press', 1)
      chestInclineId = await seedExercise(page, 'Chest: Incline Press', 2)
      await seedExercise(page, 'Back: Pull-up', 3)
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await expect(page).toHaveURL('/exercises')
  })

  test('returning from exercise opens its group and highlights it', async ({ page }) => {
    await page.getByRole('button', { name: 'Chest' }).click()
    await page.locator('.exercise-name', { hasText: 'Bench Press' }).click()
    await page.waitForURL(`/exercises/${chestBenchId}`)

    await page.goBack()
    await page.waitForURL('/exercises')

    await expect(page.locator('.exercise-name', { hasText: 'Bench Press' })).toBeVisible()
    const selectedRow = page.locator('.exercise-item.selected')
    await expect(selectedRow).toContainText('Bench Press')
    await expect(selectedRow).toBeInViewport()
  })

  test('highlight persists after page refresh', async ({ page }) => {
    await page.getByRole('button', { name: 'Chest' }).click()
    await page.locator('.exercise-name', { hasText: 'Bench Press' }).click()
    await page.waitForURL(`/exercises/${chestBenchId}`)

    await page.goBack()
    await page.waitForURL('/exercises')
    await page.reload()
    await page.waitForURL('/exercises')

    await expect(page.locator('.exercise-name', { hasText: 'Bench Press' })).toBeVisible()
    await expect(page.locator('.exercise-item.selected')).toContainText('Bench Press')
  })

  test('selecting a different exercise updates the highlight', async ({ page }) => {
    await page.getByRole('button', { name: 'Chest' }).click()
    await page.locator('.exercise-name', { hasText: 'Bench Press' }).click()
    await page.waitForURL(`/exercises/${chestBenchId}`)
    await page.goBack()
    await page.waitForURL('/exercises')

    await page.locator('.exercise-name', { hasText: 'Incline Press' }).click()
    await page.waitForURL(`/exercises/${chestInclineId}`)
    await page.goBack()
    await page.waitForURL('/exercises')

    await expect(page.locator('.exercise-item.selected')).toHaveCount(1)
    await expect(page.locator('.exercise-item.selected')).toContainText('Incline Press')
  })
})
