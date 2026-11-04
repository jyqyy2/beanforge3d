import { test, expect } from '@playwright/test'

test('shop search, categories and product links are functional', async ({ page }) => {
  await page.goto('/shop')
  await expect(page.getByRole('heading', { name: 'Find your little favourite.' })).toBeVisible()
  const cards = page.locator('.shop-product')
  await expect(cards).toHaveCount(3)

  await page.getByRole('button', { name: 'Personalised gifts', exact: true }).click()
  await expect(cards).toHaveCount(2)
  await expect(cards.first()).toContainText('Custom Car Plate Keychain')
  await page.getByRole('button', { name: 'All products' }).click()

  const search = page.getByRole('searchbox', { name: 'Search products' })
  await search.fill('stands')
  await expect(cards).toHaveCount(1)
  await expect(cards.first()).toContainText('QR / NFC Stand')
  await cards.first().click()
  await expect(page).toHaveURL(/\/product\/qr-nfc-stand$/)
  await expect(page.getByRole('heading', { name: 'Build your stand.' })).toBeVisible()

  await page.goto('/shop')
  await page.getByRole('searchbox', { name: 'Search products' }).fill('no-match')
  await expect(page.getByText('No matches yet.')).toBeVisible()
  await page.getByRole('button', { name: 'Show all products' }).click()
  await expect(cards).toHaveCount(3)
})

test('shop remains usable on mobile and search shortcut focuses the field', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('link', { name: 'Search products' }).click()
  await expect(page).toHaveURL(/\/shop#product-search$/)
  await expect(page.getByRole('searchbox', { name: 'Search products' })).toBeFocused()
  await expect(page.locator('.shop-product')).toHaveCount(3)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
