import { test, expect } from '@playwright/test'

test('Halloween preview and selections share one responsive workspace', async ({ page }) => {
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/studio/halloween')

    const workspace = page.locator('.halloween-workspace')
    const preview = workspace.getByRole('region', { name: 'Halloween clicker live preview' })
    const options = workspace.getByRole('region', { name: 'Build your Halloween clicker' })
    await expect(preview).toBeVisible()
    await expect(options).toBeVisible()
    await expect(page.locator('.halloween-config-image')).toHaveCount(0)

    const previewBounds = await preview.boundingBox()
    const optionsBounds = await options.boundingBox()
    expect(previewBounds).not.toBeNull()
    expect(optionsBounds).not.toBeNull()
    if (width > 850) {
      expect(previewBounds!.x + previewBounds!.width).toBeLessThanOrEqual(optionsBounds!.x + 1)
    } else {
      expect(previewBounds!.y + previewBounds!.height).toBeLessThanOrEqual(optionsBounds!.y + 1)
    }

    await options.getByRole('button', { name: /4 × 1/ }).click()
    await expect(preview.locator('.halloween-slot')).toHaveCount(4)
    await options.locator('.halloween-keycap-card').first().click()
    await expect(preview.locator('.halloween-slot').first().locator('img')).toBeVisible()
    await options.getByRole('button', { name: 'Pink', exact: true }).click()
    await expect(preview.locator('.halloween-board')).toHaveClass(/board-pink/)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})
