import { test, expect } from '@playwright/test'

test('stand choices, colours, quantities, merging and saved cart remain accurate', async ({ page }) => {
  await page.goto('/product/qr-nfc-stand')
  await expect(page.getByRole('button', { name: 'Chick', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.stand-photograph')).toHaveAttribute('src', /qr-chick-preview/)
  for (const design of ['Chick', 'Bee']) {
    await page.getByRole('button', { name: design, exact: true }).click()
    await expect(page.getByRole('button', { name: design, exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.stand-photograph')).toHaveAttribute('src', new RegExp(`qr-${design.toLowerCase()}`))
    await expect(page.locator('.studio-purchase h2')).toHaveText(design)
    for (const colour of ['Black', 'White', 'Orange']) {
      await page.getByRole('button', { name: colour, exact: true }).click()
      await expect(page.getByRole('button', { name: colour, exact: true })).toHaveAttribute('aria-pressed', 'true')
      await expect(page.locator('.studio-purchase')).toContainText(`${colour} · Quantity: 1`)
    }
    await page.getByRole('button', { name: 'Black', exact: true }).click()
    await page.getByRole('button', { name: 'Add my stand to cart' }).click()
  }
  await page.getByRole('button', { name: 'Increase quantity', exact: true }).click()
  await expect(page.locator('.studio-total dd')).toHaveText('S$30.00')
  await page.getByRole('button', { name: 'Add my stand to cart' }).click()
  await page.getByRole('link', { name: 'View cart →' }).click()
  await page.reload()
  await expect(page.locator('.cart-item')).toHaveCount(2)
  for (const [design, quantity] of [['Chick', '1'], ['Bee', '3']]) {
    const row = page.locator('.cart-item').filter({ hasText: `Stand: ${design}` })
    await expect(row).toContainText('QR / NFC Stand')
    await expect(row).toContainText('Colour: Black')
    await expect(row).toContainText('S$15.00 each')
    await expect(row.locator('.cart-quantity-controls strong')).toHaveText(quantity)
    await expect(row.locator('img')).toHaveAttribute('src', new RegExp(`qr-${design.toLowerCase()}`))
  }
  await expect(page.getByRole('link', { name: 'Shopping cart with 4 items' })).toBeVisible()
  await page.goto('/product/qr-nfc-stand')
  await page.getByRole('button', { name: 'Chick', exact: true }).click()
  await page.getByRole('button', { name: 'White', exact: true }).click()
  await page.getByRole('button', { name: 'Add my stand to cart' }).click()
  await page.getByRole('link', { name: 'View cart →' }).click()
  await page.reload()
  await expect(page.locator('.cart-item')).toHaveCount(3)
  await expect(page.locator('.cart-item').filter({ hasText: 'Stand: Chick' }).filter({ hasText: 'Colour: White' })).toHaveCount(1)
})

test('stand Studio shares Keycap typography and responsive presentation', async ({ page }) => {
  for (const width of [1280, 820, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/studio/keycaps')
    const styles = await page.locator('.studio-heading h1').evaluate(element => {
      const css = getComputedStyle(element)
      return [css.fontFamily, css.fontSize, css.fontWeight, css.lineHeight, css.letterSpacing]
    })
    const layoutWidth = await page.locator('.studio-layout').evaluate(element => element.getBoundingClientRect().width)
    await page.goto('/product/qr-nfc-stand')
    expect(await page.locator('.studio-heading h1').evaluate(element => {
      const css = getComputedStyle(element)
      return [css.fontFamily, css.fontSize, css.fontWeight, css.lineHeight, css.letterSpacing]
    })).toEqual(styles)
    expect(await page.locator('.studio-layout').evaluate(element => element.getBoundingClientRect().width)).toBe(layoutWidth)
    const image = page.locator('.stand-photograph')
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0)
    const before = await image.boundingBox()
    const bee = page.getByRole('button', { name: 'Bee', exact: true })
    await bee.focus()
    await page.keyboard.press('Enter')
    await expect(bee).toHaveAttribute('aria-pressed', 'true')
    expect(await image.evaluate(element => getComputedStyle(element).objectFit)).toBe('contain')
    const after = await image.boundingBox()
    expect(after?.width).toBe(before?.width)
    expect(after?.height).toBe(before?.height)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(await bee.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none')
  }
})

test('stand page navigation and quantity controls remain accessible', async ({ page }) => {
  await page.goto('/product/qr-nfc-stand')
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  const links = await page.locator('.header a, .stand-studio > .back-link').evaluateAll(elements => elements.map(element => element.getAttribute('href')!))
  for (const [index, href] of links.entries()) {
    await page.goto('/product/qr-nfc-stand')
    await page.locator('.header a, .stand-studio > .back-link').nth(index).click()
    await expect(page).toHaveURL(new URL(href, page.url()).href)
    if (href.includes('#')) await expect(page.locator(`[id="${href.split('#')[1]}"]`)).toBeAttached()
    else await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
  await page.goto('/product/qr-nfc-stand')
  await expect(page.getByRole('button', { name: 'Decrease quantity', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Increase quantity', exact: true }).click()
  await page.getByRole('button', { name: 'Decrease quantity', exact: true }).click()
  await expect(page.locator('.studio-total dd')).toHaveText('S$15.00')
  expect(errors).toEqual([])
})

test('stand draft restores, resets only after confirmation and leaves cart intact', async ({ page }) => {
  await page.goto('/product/qr-nfc-stand')
  await page.getByRole('button', { name: 'Preview Bee', exact: true }).click()
  await expect(page.locator('.stand-photograph')).toHaveAttribute('src', /qr-bee-preview/)
  await page.getByRole('button', { name: 'White', exact: true }).click()
  await page.getByRole('button', { name: 'Increase quantity', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Stand draft' })).toContainText('Draft saved')
  await page.reload()
  await expect(page.locator('.studio-purchase')).toContainText('White · Quantity: 2')
  await expect(page.locator('.studio-purchase h2')).toHaveText('Bee')
  await page.getByRole('button', { name: 'Add my stand to cart' }).click()
  await page.getByRole('button', { name: 'Start new design', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Keep my design' })).toBeFocused()
  await page.getByRole('button', { name: 'Keep my design' }).click()
  await expect(page.locator('.studio-purchase h2')).toHaveText('Bee')
  await page.getByRole('button', { name: 'Start new design', exact: true }).click()
  await page.locator('#stand-reset').getByRole('button', { name: 'Start new design', exact: true }).click()
  await expect(page.locator('.studio-purchase h2')).toHaveText('Chick')
  await expect(page.locator('.studio-purchase')).toContainText('Black · Quantity: 1')
  await page.getByRole('link', { name: 'Shopping cart with 2 items' }).click()
  await expect(page.locator('.cart-item')).toContainText('Stand: Bee')
  await expect(page.locator('.cart-item')).toContainText('Colour: White')
})

test('unreadable stand draft stays untouched until explicit reset preserves it', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('beanforge-stand-draft', 'broken draft'))
  await page.goto('/product/qr-nfc-stand')
  await expect(page.getByRole('region', { name: 'Stand draft' })).toContainText('kept it untouched')
  expect(await page.evaluate(() => localStorage.getItem('beanforge-stand-draft'))).toBe('broken draft')
  await page.getByRole('button', { name: 'Start new design', exact: true }).click()
  await page.locator('#stand-reset').getByRole('button', { name: 'Start new design', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Stand draft' })).toContainText('Draft saved')
  expect(await page.evaluate(() => localStorage.getItem('beanforge-stand-draft-recovery'))).toBe('broken draft')
})

test('stand draft write failure never claims saved', async ({ page }) => {
  await page.addInitScript(() => {
    const setItem = Storage.prototype.setItem
    Storage.prototype.setItem = function(key, value) {
      if (key === 'beanforge-stand-draft') throw new Error('Write unavailable')
      return setItem.call(this, key, value)
    }
  })
  await page.goto('/product/qr-nfc-stand')
  await expect(page.getByRole('region', { name: 'Stand draft' })).toContainText('Draft not saved')
  await page.getByRole('button', { name: 'Bee', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Stand draft' })).toContainText('Draft not saved')
  expect(await page.evaluate(() => localStorage.getItem('beanforge-stand-draft'))).toBeNull()
})

test('stand draft read failure blocks saving', async ({ page }) => {
  await page.addInitScript(() => {
    const getItem = Storage.prototype.getItem
    Storage.prototype.getItem = function(key) {
      if (key === 'beanforge-stand-draft') throw new Error('Read unavailable')
      return getItem.call(this, key)
    }
  })
  await page.goto('/product/qr-nfc-stand')
  await expect(page.getByRole('button', { name: 'Start new design', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Reload and retry' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Stand draft' })).toContainText('kept it untouched')
})
