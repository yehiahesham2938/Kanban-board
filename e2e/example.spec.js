import { test, expect } from '@playwright/test'

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/kanban board/i)
  await expect(page.locator('h1')).toContainText('Kanban Board')
})

