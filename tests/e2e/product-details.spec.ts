import { test, expect } from '@playwright/test'

test('plate colours change photography and distinct plate texts stay distinct in cart', async ({ page }) => {
  await page.goto('/product/custom-carplate-keychain')
  await expect(page.locator('.product-price')).toHaveText('S$4.90')
  const add = page.getByRole('button', { name: 'Add to cart' })
  await expect(add).toBeDisabled()
  const photo = page.locator('.product-detail-image img')
  const red = await photo.getAttribute('src')
  for (const colour of ['White', 'Black', 'Yellow']) {
    await page.getByRole('button', { name: colour, exact: true }).click()
    await expect(photo).toHaveAttribute('alt', `Custom Car Plate Keychain in ${colour}`)
    expect(await photo.getAttribute('src')).not.toBe(red)
  }
  await page.getByRole('textbox', { name: 'Your plate text' }).fill('smx 6769 l')
  await expect(page.getByText('Your text: SMX 6769 L')).toBeVisible()
  await add.click()
  await page.getByRole('dialog').getByRole('button', { name: 'Continue shopping' }).click()
  await page.getByRole('textbox', { name: 'Your plate text' }).fill('ABC 123')
  await add.click()
  await page.getByRole('dialog').getByRole('link', { name: /View cart/ }).click()
  await expect(page.getByText('Plate text: SMX 6769 L')).toBeVisible()
  await expect(page.getByText('Plate text: ABC 123')).toBeVisible()
  await expect(page.locator('.cart-item')).toHaveCount(2)
  await page.reload()
  await expect(page.locator('.cart-item')).toHaveCount(2)
})

test('name keychain prices one to ten letters and saves the chosen name', async ({ page }) => {
  await page.goto('/product/custom-name-keychain')
  await expect(page.locator('.product-price')).toHaveText('From S$6.90')
  const add = page.getByRole('button', { name: 'Add to cart' })
  await expect(add).toBeDisabled()
  await page.getByRole('textbox', { name: 'Your name (1–10 letters)' }).fill('Joanne')
  await expect(page.getByText('Your text: JOANNE')).toBeVisible()
  await expect(add).toBeEnabled()
  await expect(page.locator('.product-price')).toHaveText('S$11.90')
  await page.getByRole('textbox', { name: 'Your name (1–10 letters)' }).fill('ABCDEFGHIJ')
  await expect(page.locator('.product-price')).toHaveText('S$15.90')
  await page.getByRole('textbox', { name: 'Your name (1–10 letters)' }).fill('J')
  await expect(add).toBeEnabled()
  await add.click()
  await page.getByRole('dialog').getByRole('link', { name: /View cart/ }).click()
  await expect(page.getByText('Name: J')).toBeVisible()
})

test('product options remain usable on narrow phones and tablets', async ({ page }) => {
  for (const width of [320, 390, 820]) {
    await page.setViewportSize({ width, height: 850 })
    await page.goto('/product/custom-carplate-keychain')
    await expect(page.getByRole('textbox', { name: 'Your plate text' })).toBeVisible()
    await page.getByRole('button', { name: 'Yellow', exact: true }).click()
    await expect(page.locator('.product-detail-image img')).toHaveAttribute('alt', 'Custom Car Plate Keychain in Yellow')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})
