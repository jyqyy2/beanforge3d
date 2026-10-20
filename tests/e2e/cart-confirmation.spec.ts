import { test, expect } from '@playwright/test'

test('product, stand and studios use one cart confirmation', async ({ page }) => {
  await page.goto('/product/bean-keycap')
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click()
  const popup = page.getByRole('dialog', { name: '✓ Item added to your cart' })
  await expect(popup.getByRole('link', { name: 'View cart (1)' })).toBeVisible()
  await expect(popup.getByRole('button', { name: 'Checkout unavailable' })).toBeDisabled()
  await expect(page.locator('.cart-confirmation')).toHaveCount(0)
  await popup.getByRole('link', { name: 'View cart (1)' }).click()
  await expect(popup).toHaveCount(0)

  await page.goto('/product/qr-nfc-stand')
  await page.getByRole('button', { name: 'Add my stand to cart' }).click()
  await expect(popup.getByRole('link', { name: 'View cart (2)' })).toBeVisible()
  await popup.getByRole('button', { name: 'Continue shopping' }).click()
  await expect(popup).toHaveCount(0)

  await page.goto('/studio/keycaps')
  await page.getByRole('textbox', { name: 'Character 1', exact: true }).fill('A')
  await page.getByRole('button', { name: 'Add my creation to cart' }).click()
  await expect(popup.getByRole('link', { name: 'View cart (3)' })).toBeVisible()
  await expect(page.getByText(/Added A to your cart/)).toHaveCount(0)
  await popup.getByRole('button', { name: 'Close cart confirmation' }).click()

  await page.goto('/studio/halloween')
  await page.locator('.halloween-keycap-card').first().click()
  await page.getByRole('button', { name: 'Add my creation to cart' }).click()
  await expect(popup.getByRole('link', { name: 'View cart (4)' })).toBeVisible()
  await expect(popup.getByRole('button', { name: 'Checkout unavailable' })).toBeDisabled()
  await popup.getByRole('link', { name: 'View cart (4)' }).click()
  await expect(page.getByRole('article')).toHaveCount(4)
})
