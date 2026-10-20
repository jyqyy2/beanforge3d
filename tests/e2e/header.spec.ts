import { test, expect } from '@playwright/test'

const paths = [
  '/',
  '/studio',
  '/studio/keycaps',
  '/studio/halloween',
  '/cart',
  '/product/bean-keycap',
  '/product/qr-nfc-stand',
]

for (const width of [1280, 820, 390, 320]) {
  test(`shared menu stays aligned across pages at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    let reference: { height: number; fontSize: string; links: string[] } | undefined

    for (const path of paths) {
      await page.goto(path)
      const header = page.locator('.header')
      const links = header.locator('.nav a')
      await expect(links).toHaveText(['Shop', 'Keycap Studio', 'Custom', 'Corporate', 'About'])
      for (const link of await links.all()) await expect(link).toBeVisible()
      const metrics = await page.evaluate(() => {
        const header = document.querySelector('.header')!
        const nav = document.querySelector('.nav')!
        const bounds = header.getBoundingClientRect()
        const logo = header.querySelector('.logo')!.getBoundingClientRect()
        const actions = header.querySelector('.header-actions')!.getBoundingClientRect()
        return {
          height: bounds.height,
          fontSize: getComputedStyle(nav).fontSize,
          links: Array.from(nav.querySelectorAll('a'), link => link.textContent!.trim()),
          overflow: document.documentElement.scrollWidth > window.innerWidth,
          rootWidth: document.querySelector('#root')!.getBoundingClientRect().width,
          actionsClearOfLogo: logo.right < actions.left || logo.bottom < actions.top,
        }
      })
      expect(metrics.overflow, `${path} at ${width}px`).toBe(false)
      expect(metrics.rootWidth).toBe(width)
      expect(metrics.actionsClearOfLogo, `${path} at ${width}px`).toBe(true)
      if (reference) {
        expect(metrics.height, path).toBe(reference.height)
        expect(metrics.fontSize, path).toBe(reference.fontSize)
        expect(metrics.links, path).toEqual(reference.links)
      } else {
        reference = metrics
      }
    }
  })
}
