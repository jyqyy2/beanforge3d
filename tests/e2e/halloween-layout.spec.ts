import { test, expect } from '@playwright/test'

test('Halloween preview and selections share one responsive workspace', async ({ page }) => {
  for (const width of [1280, 820, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/studio/halloween')

    const workspace = page.locator('.halloween-workspace')
    const preview = workspace.getByRole('region', { name: 'Halloween clicker live preview' })
    const options = workspace.getByRole('region', { name: 'Build your Halloween clicker' })
    await expect(preview).toBeVisible()
    await expect(options).toBeVisible()
    await expect(options.locator('.halloween-step')).toHaveCount(3)
    for (const step of ['STEP 1', 'STEP 2', 'STEP 3']) {
      await expect(options.getByText(step, { exact: true })).toBeVisible()
    }
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
    await expect(options.locator('.halloween-colours button')).toHaveCount(6)
    for (const colour of ['Purple', 'White', 'Turquoise']) {
      await options.getByRole('button', { name: colour, exact: true }).click()
      await expect(preview.locator('.halloween-board')).toHaveClass(new RegExp(`board-${colour.toLowerCase()}`))
      await expect(options.getByRole('button', { name: colour, exact: true })).toHaveAttribute('aria-pressed', 'true')
    }
    await page.reload()
    await expect(page.locator('.halloween-board')).toHaveClass(/board-turquoise/)
    expect(await page.locator('.halloween-keycap-picker legend').evaluate(element => getComputedStyle(element).textAlign)).toBe('left')
    expect(await page.locator('.halloween-keycap-picker > .studio-note').evaluate(element => getComputedStyle(element).textAlign)).toBe('left')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})
