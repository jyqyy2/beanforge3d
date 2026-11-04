import { test, expect } from '@playwright/test'

test('landing page keeps product links and the live Studio accessible', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Little things.Big joy.')
  const products = page.locator('.product-card')
  await expect(products).toHaveCount(3)
  for (const slug of ['custom-carplate-keychain', 'custom-name-keychain', 'qr-nfc-stand']) {
    await expect(page.locator(`.product-link[href="/product/${slug}"]`)).toBeVisible()
  }
  await page.locator('.landing-studio').scrollIntoViewIfNeeded()
  await expect(page.locator('.landing-studio img')).toBeVisible()
  await expect.poll(() => page.locator('.landing-studio img').evaluate(image =>
    (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  await page.getByRole('link', { name: 'Start designing →', exact: true }).click()
  await expect(page).toHaveURL(/\/studio$/)
  await expect(page.locator('main')).toBeVisible()
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
    if (link.href === '#corporate-request') continue
    await page.goto('/')
    await page.locator('.header a, .site a').nth(index).click()
    if (link.href.includes('#')) {
      const fragment = link.href.split('#')[1]
      await expect(page).toHaveURL(new RegExp(`#${fragment}$`))
      await expect(page.locator(`[id="${fragment}"]`)).toBeAttached()
    } else if (link.href.includes('/studio/keycaps')) {
      await expect(page.getByRole('heading', { name: 'Build your own.' })).toBeVisible()
    } else if (link.href === '/studio') {
      await expect(page).toHaveURL(/\/studio$/)
      await expect(page.locator('main')).toBeVisible()
    } else if (link.href === '/shop' || link.href.startsWith('/shop#')) {
      await expect(page.locator('.shop-page')).toBeVisible()
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
    { slug: 'custom-carplate-keychain', name: 'Custom Car Plate Keychain', price: 'S$4.90', text: 'SMX 6769 L' },
    { slug: 'custom-name-keychain', name: 'Custom Name Keychain', price: 'From S$6.90', text: 'J' },
    { slug: 'qr-nfc-stand', name: 'QR / NFC Stand', price: 'S$15.90' },
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
    if (product.text) await page.getByRole('textbox', { name: product.slug === 'custom-name-keychain' ? 'Your name (1–10 letters)' : 'Your plate text' }).fill(product.text)
    await page.getByRole('button', { name: 'Increase quantity', exact: true }).click()
    await page.getByRole('button', { name: product.slug === 'qr-nfc-stand' ? 'Add my stand to cart' : 'Add to cart', exact: true }).click()
    await page.getByRole('dialog', { name: '✓ Item added to your cart' }).getByRole('link', { name: /View cart/ }).click()
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

test('six categories expose five working destinations and one non-interactive preview', async ({ page }) => {
  await page.goto('/')
  const cards = page.locator('.category-card')
  await expect(cards).toHaveCount(6)
  await expect(cards.locator('h4')).toHaveText(['Keycap Studio', 'Custom Nametags', 'Custom Carplate Keychain', 'QR / NFC', 'Keycaps', 'SKADIS Accessories'])
  const destinations = ['/studio', '/product/custom-name-keychain', '/product/custom-carplate-keychain', '/product/qr-nfc-stand', '/studio/keycaps']
  for (const [index, destination] of destinations.entries()) {
    const card = cards.nth(index)
    await expect(card).toHaveAttribute('href', destination)
    await expect(card.locator('a, button')).toHaveCount(0)
    await card.focus()
    expect(await card.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp(`${destination}$`))
    await expect(page.locator('h1')).toBeVisible()
    await page.goBack()
    await expect(cards).toHaveCount(6)
  }
  for (const card of await page.locator('.category-coming-soon').all()) {
    await expect(card).toContainText('Coming soon')
    await expect(card.locator('a, button, [tabindex]')).toHaveCount(0)
    expect(await card.getAttribute('href')).toBeNull()
    await card.hover()
    expect(await card.evaluate(element => getComputedStyle(element).transform)).toBe('none')
    expect(await card.evaluate(element => getComputedStyle(element, '::after').content)).toBe('none')
    const url = page.url()
    await card.click()
    expect(page.url()).toBe(url)
  }
  for (const [width, columns] of [[1280, 3], [820, 2], [390, 2]]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.locator('.category-grid').first().evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(columns)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

for (const fragment of ['corporate-request']) {
  test(`known missing destination: ${fragment}`, async ({ page }) => {
    test.fail(true, 'Existing destination has no section or implementation; needs product/business direction, not a route rewrite.')
    await page.goto('/')
    await page.locator(`a[href="#${fragment}"]`).click()
    await expect(page).toHaveURL(new RegExp(`#${fragment}$`))
    expect(await page.locator(`[id="${fragment}"]`).count()).toBe(1)
  })
}
