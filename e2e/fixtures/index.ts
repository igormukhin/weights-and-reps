import { test as base, expect } from '@playwright/test'

export { expect }

export const test = base.extend({
  page: async ({ page }, use) => {
    const errors: Error[] = []
    page.on('pageerror', (err) => errors.push(err))
    await use(page)
    if (errors.length > 0) {
      throw new Error(`JavaScript errors on page:\n${errors.map((e) => e.message).join('\n')}`)
    }
  },
})
