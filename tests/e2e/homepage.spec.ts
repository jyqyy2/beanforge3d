import { test, expect } from '@playwright/test'

test('landing page keeps product links and the live Studio accessible', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Small things.Made for you.')
  const products = page.locator('.product-card')
  await expect(products).toHaveCount(3)
  for (const slug of ['bean-keycap', 'custom-name-keychain', 'qr-nfc-stand']) {
    await expect(page.locator(`.product-link[href="/product/${slug}"]`)).toBeVisible()
  }
  await page.locator('.landing-studio').scrollIntoViewIfNeeded()
  await expect(page.locator('.landing-studio img')).toBeVisible()
  await expect.poll(() => page.locator('.landing-studio img').evaluate(image =>
    (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  await page.getByRole('link', { name: 'Start designing →', exact: true }).click()
  await expect(page).toHaveURL(/\/studio\/keycaps$/)
  await expect(page.getByRole('heading', { name: 'Build your own.' })).toBeVisible()
  expect(errors).toEqual([])
})
