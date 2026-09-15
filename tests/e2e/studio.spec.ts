import { expect, test } from '@playwright/test'
import { Buffer } from 'node:buffer'

test.beforeEach(async ({ page }) => {
  await page.goto('/studio/keycaps')
})

for (const kind of ['cart', 'draft']) {
  test(`initial ${kind} read failure preserves original data until reload retry`, async ({ page }) => {
    await page.getByRole('textbox', { name: 'Character 1', exact: true }).fill('Z')
    await page.getByRole('button', { name: 'Add my creation to cart' }).click()
    const key = kind === 'cart' ? 'beanforge-cart' : 'beanforge-keycap-draft'
    const original = await page.evaluate(key => localStorage.getItem(key), key)
    await page.addInitScript(key => {
      if (sessionStorage.getItem('read-fault-used')) return
      sessionStorage.setItem('read-fault-used', 'yes')
      const originalRead = Storage.prototype.getItem
      let failed = false
      Storage.prototype.getItem = function (name) {
        if (name === key && !failed) { failed = true; throw new Error('Transient initial read failure') }
        return originalRead.call(this, name)
      }
    }, key)
    await page.reload()
    await expect(page.getByRole('heading', { name: `Your saved ${kind} could not be loaded.` })).toBeVisible()
    await expect(page.getByRole('textbox')).toHaveCount(0)
    expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(original)
    await page.getByRole('button', { name: 'Reload and retry' }).click()
    await expect(page.getByRole('textbox', { name: 'Character 1', exact: true })).toHaveValue('Z')
    expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(original)
    await page.goto('/cart')
    await expect(page.getByRole('article')).toContainText('Custom keycaps · Z')
  })
}

test('malformed draft stays untouched and exports exact data separately from cart', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('beanforge-cart', '{broken cart')
    localStorage.setItem('beanforge-keycap-draft', '{broken draft')
    localStorage.setItem('beanforge-keycap-draft-recovery', '{older draft')
  })
  await page.reload()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('beanforge-cart-recovery'))).toBe('{broken cart')
  await expect(page.getByRole('heading', { name: 'Your saved draft could not be loaded.' })).toBeVisible()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download recovery file' }).press('Enter')
  const download = await downloadPromise
  const stream = await download.createReadStream()
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  expect(JSON.parse(Buffer.concat(chunks).toString())).toEqual({ format: 'beanforge-draft-recovery', version: 1, raw: '{broken draft', preservedRaw: '{older draft' })
  expect(await page.evaluate(() => localStorage.getItem('beanforge-keycap-draft'))).toBe('{broken draft')
  expect(await page.evaluate(() => localStorage.getItem('beanforge-keycap-draft-recovery'))).toBe('{older draft')
  await expect(page.getByRole('button', { name: 'Download recovery file' })).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Reload and retry' }).click()
  await expect(page.getByRole('button', { name: 'Download recovery file' })).toBeVisible()
})

test('counts, empty selection, colours, hidden characters and draft restoration', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Download recovery file' })).toHaveCount(0)
  for (let count = 1; count <= 8; count++) {
    await page.getByRole('button', { name: count === 1 ? '1 board' : `${count} boards`, exact: true }).click()
    await expect(page.getByRole('textbox', { name: /^Character / })).toHaveCount(count)
    await expect(page.getByRole('button', { name: /empty\. Add a character/ })).toHaveCount(count)
    await expect(page.getByRole('button', { name: 'Complete your design to continue' })).toBeDisabled()
  }
  await page.getByRole('button', { name: 'Character 8, empty. Add a character.' }).press('Enter')
  await expect(page.getByRole('textbox', { name: 'Character 8', exact: true })).toBeFocused()
  await page.getByRole('textbox', { name: 'Character 8', exact: true }).fill('z')
  await page.getByRole('group', { name: 'Keycap colour', exact: true }).getByRole('button', { name: 'Blue', exact: true }).click()
  await page.getByRole('group', { name: 'Character colour', exact: true }).getByRole('button', { name: 'Pink', exact: true }).click()
  await page.getByRole('button', { name: 'Close palette' }).click()
  await expect(page.getByRole('textbox', { name: 'Character 8', exact: true })).toBeFocused()
  await page.getByRole('button', { name: '1 board', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: '8 boards', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Character 8', exact: true })).toHaveValue('Z')
  await expect(page.getByRole('region', { name: 'Keycap layout preview' })).toContainText('Z (keycap: Blue, character: Pink)')
  await expect(page.locator('.studio-total')).toContainText('S$69.00')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('cart snapshots merge, reset preserves cart, edits save and discard', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Character 1', exact: true }).fill('a')
  await page.getByRole('button', { name: 'Add my creation to cart' }).click()
  await page.getByRole('button', { name: 'Add my creation to cart' }).click()
  await page.getByRole('button', { name: 'Start new design', exact: true }).click()
  await page.getByRole('button', { name: 'Keep my design' }).click()
  await expect(page.getByRole('textbox', { name: 'Character 1', exact: true })).toHaveValue('A')
  await page.getByRole('button', { name: 'Start new design', exact: true }).click()
  await page.getByRole('group', { name: 'Start a new design?' }).getByRole('button', { name: 'Start new design', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Character 1', exact: true })).toHaveValue('')
  await page.goto('/cart')
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(page.getByRole('article')).toContainText('S$26.00')
  await page.getByRole('link', { name: 'Edit design', exact: true }).click()
  await page.getByRole('textbox', { name: 'Character 1', exact: true }).fill('B')
  await page.getByRole('link', { name: '← Cancel and return to cart' }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await page.getByRole('button', { name: 'Keep editing' }).click()
  await expect(page.getByRole('textbox', { name: 'Character 1', exact: true })).toBeFocused()
  await page.getByRole('button', { name: 'Save changes to cart' }).click()
  await expect(page.getByRole('article')).toContainText('Custom keycaps · B')
  await page.getByRole('link', { name: 'Edit design', exact: true }).click()
  await page.getByRole('textbox', { name: 'Character 1', exact: true }).fill('C')
  await page.getByRole('link', { name: '← Cancel and return to cart' }).click()
  await page.getByRole('button', { name: 'Discard edits and leave' }).click()
  await expect(page.getByRole('article')).toContainText('Custom keycaps · B')
})

test('failed browser writes show warnings and recover on the next change', async ({ page }) => {
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Object.defineProperty(window, 'restoreStorage', { value: () => { Storage.prototype.setItem = original } })
    Storage.prototype.setItem = () => { throw new Error('Test quota failure') }
  })
  await page.getByRole('textbox', { name: 'Character 1', exact: true }).fill('A')
  await expect(page.getByRole('region', { name: 'Studio draft' })).toContainText('Draft not saved')
  await page.getByRole('button', { name: 'Add my creation to cart' }).click()
  await expect(page.getByRole('alert')).toContainText('could not be saved')
  await page.evaluate(() => (window as unknown as { restoreStorage: () => void }).restoreStorage())
  await page.getByRole('textbox', { name: 'Character 1', exact: true }).fill('B')
  await expect(page.getByRole('region', { name: 'Studio draft' })).toContainText('Draft saved')
  await page.getByRole('button', { name: 'Add my creation to cart' }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
})
