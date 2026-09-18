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

test('all implemented landing links navigate, and every product can be bought into the cart', async ({ page }) => {
  test.setTimeout(90000)
  await page.goto('/')
  const links = await page.locator('.header a, .site a').evaluateAll(elements => elements.map(element => ({
    href: element.getAttribute('href')!,
    text: element.textContent?.trim(),
  })))
  for (let index = 0; index < links.length; index++) {
    const link = links[index]
    if (['#skadis', '#corporate-request'].includes(link.href)) continue
    await page.goto('/')
    await page.locator('.header a, .site a').nth(index).click()
    if (link.href.includes('#')) {
      const fragment = link.href.split('#')[1]
      await expect(page).toHaveURL(new RegExp(`#${fragment}$`))
      await expect(page.locator(`[id="${fragment}"]`)).toBeAttached()
    } else if (link.href.includes('/studio/keycaps')) {
      await expect(page.getByRole('heading', { name: 'Build your own.' })).toBeVisible()
    } else if (link.href === '/cart') {
      await expect(page.getByRole('heading', { name: 'Shopping cart' })).toBeVisible()
    } else if (link.href === '/') {
      await expect(page.locator('.hero')).toBeVisible()
    } else {
      await expect(page).toHaveURL(new RegExp(`${link.href}$`))
      await expect(page.locator(link.href.endsWith('/qr-nfc-stand') ? '.stand-studio' : '.product-detail')).toBeVisible()
    }
  }
  const products = [
    { slug: 'bean-keycap', name: 'Bean Keycap', price: 'S$18.00' },
    { slug: 'custom-name-keychain', name: 'Custom Name Keychain', price: 'S$9.00' },
    { slug: 'qr-nfc-stand', name: 'QR / NFC Stand', price: 'S$15.00' },
  ]
  for (const [index, product] of products.entries()) {
    for (const surface of ['.product-image', '.product-info']) {
      await page.goto('/')
      const target = page.locator('.product-card').nth(index).locator(surface)
      await target.scrollIntoViewIfNeeded()
      const bounds = await target.boundingBox()
      expect(bounds).not.toBeNull()
      await page.mouse.click(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2)
      await expect(page).toHaveURL(new RegExp(`/product/${product.slug}$`))
      await expect(page.locator('h1')).toHaveText(product.slug === 'qr-nfc-stand' ? 'Build your stand.' : product.name)
      await expect(page.locator(product.slug === 'qr-nfc-stand' ? '.studio-price-action dd' : '.product-price').first()).toHaveText(product.price)
    }
    await page.locator(product.slug === 'qr-nfc-stand' ? '.studio-options fieldset:nth-child(2) button' : '.colour-button').last().click()
    await page.getByRole('button', { name: 'Increase quantity', exact: true }).click()
    await page.getByRole('button', { name: product.slug === 'qr-nfc-stand' ? 'Add my stand to cart' : 'Add to cart', exact: true }).click()
    await page.getByRole('link', { name: 'View cart →' }).click()
    const row = page.locator('.cart-item').filter({ hasText: product.name })
    await expect(row.locator('.cart-quantity-controls strong')).toHaveText('2')
    await row.getByRole('button', { name: /Increase quantity/ }).click()
    await expect(row.locator('.cart-quantity-controls strong')).toHaveText('3')
    await row.getByRole('button', { name: /Decrease quantity/ }).click()
    await row.getByRole('button', { name: /Remove/ }).click()
    await expect(row).toHaveCount(0)
  }
})

test('desktop, tablet and mobile preserve images, section order and keyboard access', async ({ page }) => {
  for (const width of [1280, 820, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.locator('.categories + .landing-studio + .featured')).toHaveCount(1)
    for (const image of await page.locator('.site img').all()) {
      await image.scrollIntoViewIfNeeded()
      await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
      await expect(image).toHaveAttribute('alt')
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    await page.goto('/')
    const count = await page.locator('.header a, .header button, .site a, .site button').count()
    for (let index = 0; index < count; index++) {
      await page.keyboard.press('Tab')
      const focused = page.locator(':focus')
      await expect(focused).toBeVisible()
      expect(await focused.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none')
    }
  }
})

for (const fragment of ['skadis', 'corporate-request']) {
  test(`known missing destination: ${fragment}`, async ({ page }) => {
    test.fail(true, 'Existing destination has no section or implementation; needs product/business direction, not a route rewrite.')
    await page.goto('/')
    await page.locator(`a[href="#${fragment}"]`).click()
    await expect(page).toHaveURL(new RegExp(`#${fragment}$`))
    expect(await page.locator(`[id="${fragment}"]`).count()).toBe(1)
  })
}

test('known unimplemented search and wishlist actions', async ({ page }) => {
  test.fail(true, 'Existing buttons have no handlers; implementing these features is outside the UI redesign.')
  await page.goto('/')
  const unchanged: string[] = []
  for (const button of await page.locator('.header button, .product-wishlist').all()) {
    const before = await page.locator('#root').innerHTML()
    const url = page.url()
    await button.click()
    if (url === page.url() && before === await page.locator('#root').innerHTML()) {
      unchanged.push(await button.getAttribute('aria-label') ?? 'Unlabelled button')
    }
  }
  expect(unchanged).toEqual([])
})
