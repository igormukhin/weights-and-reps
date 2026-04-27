import { test, expect } from '../fixtures'
import { signInAsTestUser } from '../fixtures/auth'
import { clearExercises, seedExercise } from '../fixtures/exercises'
import { navigateToExercise } from '../fixtures/sessions'

test.describe.configure({ mode: 'serial' })

let exerciseId: string

test.describe('Rename exercise from detail view', () => {
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
    await navigateToExercise(page, exerciseId)
  })

  test('pen button opens rename dialog and updates app bar title', async ({ page }) => {
    await page.getByRole('button', { name: 'Rename exercise' }).click()
    await page.getByLabel('Exercise name').fill('Romanian Deadlift')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('.v-toolbar-title__placeholder')).toContainText('Romanian Deadlift')
  })

  test('cancel rename leaves app bar title unchanged', async ({ page }) => {
    // After the previous test the exercise is named "Romanian Deadlift"
    await page.getByRole('button', { name: 'Rename exercise' }).click()
    await page.getByLabel('Exercise name').fill('Something Else')
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.locator('.v-toolbar-title__placeholder')).toContainText('Romanian Deadlift')
    await expect(page.locator('.v-toolbar-title__placeholder')).not.toContainText('Something Else')
  })
})
