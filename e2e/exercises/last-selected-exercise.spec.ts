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

test.describe('Last selected after adding exercise', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
      await seedExercise(page, 'Chest: Bench Press', 1)
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await expect(page).toHaveURL('/exercises')
  })

  test('newly added exercise is highlighted on return to home', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit', exact: true }).click()
    await page.waitForURL('/exercises/edit')

    await page.locator('[data-testid="add-exercise-fab"]').click()
    await page.getByLabel('Exercise name').fill('Chest: Cable Fly')
    await page.getByRole('button', { name: 'Add' }).click()
    await expect(page.getByLabel('Exercise name')).not.toBeVisible()

    await page.getByRole('button', { name: 'Done' }).click()
    await page.waitForURL('/exercises')

    await expect(page.locator('.exercise-item.selected')).toHaveCount(1)
    await expect(page.locator('.exercise-item.selected')).toContainText('Cable Fly')
  })

  test('no highlight when returning without adding', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit', exact: true }).click()
    await page.waitForURL('/exercises/edit')

    await page.getByRole('button', { name: 'Done' }).click()
    await page.waitForURL('/exercises')

    await expect(page.locator('.exercise-item.selected')).toHaveCount(0)
  })
})

test.describe('Last selected after renaming exercise', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await signInAsTestUser(page)
      await clearExercises(page)
      await seedExercise(page, 'Chest: Bench Press', 1)
      await seedExercise(page, 'Chest: Incline Press', 2)
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await expect(page).toHaveURL('/exercises')
  })

  test('renamed exercise is highlighted on return to home', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit', exact: true }).click()
    await page.waitForURL('/exercises/edit')

    await page.locator('[data-testid="rename-exercise-btn"]').first().click()
    await page.getByLabel('Exercise name').clear()
    await page.getByLabel('Exercise name').fill('Chest: Cable Fly')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByLabel('Exercise name')).not.toBeVisible()

    await page.getByRole('button', { name: 'Done' }).click()
    await page.waitForURL('/exercises')

    await expect(page.locator('.exercise-item.selected')).toHaveCount(1)
    await expect(page.locator('.exercise-item.selected')).toContainText('Cable Fly')
  })

  test('last renamed exercise wins when two are renamed', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit', exact: true }).click()
    await page.waitForURL('/exercises/edit')

    await page.locator('[data-testid="rename-exercise-btn"]').first().click()
    await page.getByLabel('Exercise name').clear()
    await page.getByLabel('Exercise name').fill('Chest: First Renamed')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByLabel('Exercise name')).not.toBeVisible()

    await page.locator('[data-testid="rename-exercise-btn"]').last().click()
    await page.getByLabel('Exercise name').clear()
    await page.getByLabel('Exercise name').fill('Chest: Second Renamed')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByLabel('Exercise name')).not.toBeVisible()

    await page.getByRole('button', { name: 'Done' }).click()
    await page.waitForURL('/exercises')

    await expect(page.locator('.exercise-item.selected')).toHaveCount(1)
    await expect(page.locator('.exercise-item.selected')).toContainText('Second Renamed')
  })
})
