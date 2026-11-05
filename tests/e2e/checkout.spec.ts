import { expect, test } from '@playwright/test'

test('cart checkout stays unavailable without a server configuration', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('beanforge-cart', JSON.stringify([{
      productSlug: 'custom-carplate-keychain', name: 'Custom Car Plate Keychain', price: 4.90,
      colour: 'Red', personalisation: 'SMX 6769 L', quantity: 1,
    }]))
  })
  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Shopping cart' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Check out' })).toBeDisabled()
  await expect(page.getByText('Checkout has not been configured yet.')).toHaveCount(0)
  await page.getByLabel('Deliver to').selectOption('MY')
  await expect(page.getByRole('button', { name: 'Check out' })).toBeDisabled()
})
