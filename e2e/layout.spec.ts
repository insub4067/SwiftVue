// Enforces docs/LAYOUT.md in a real browser. These are the failures that
// happy-dom unit tests cannot see: every layout blowout so far shipped with
// the whole unit suite green.
import { test, expect, type Page } from '@playwright/test'

const WIDTHS = [320, 360, 390, 430]
const TABS = ['Components', 'Controls', 'Layout', 'Styles']

async function overflowOffenders(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const found: string[] = []
    if (document.documentElement.scrollWidth > window.innerWidth + 1) {
      found.push(`documentElement ${document.documentElement.scrollWidth} > ${window.innerWidth}`)
    }
    // The panes the library owns must never scroll sideways; horizontal
    // ScrollViews contain their own overflow and never leak into these.
    for (const sel of ['.tab-content', '.nav-content']) {
      for (const el of document.querySelectorAll(sel)) {
        if (el.scrollWidth > el.clientWidth + 1) {
          found.push(`${sel} ${el.scrollWidth} > ${el.clientWidth}`)
        }
      }
    }
    return found
  })
}

for (const width of WIDTHS) {
  test(`no horizontal overflow on any tab at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 780 })
    await page.goto('/')

    for (const tab of TABS) {
      await page.getByRole('tab', { name: tab }).click()
      await page.waitForTimeout(150)

      expect(await overflowOffenders(page), `${tab} tab at ${width}px`).toEqual([])

      const bar = page.locator('.tab-bar')
      const box = await bar.boundingBox()
      expect(box, 'tab bar must be visible').not.toBeNull()
      expect(box!.y + box!.height, 'tab bar must sit inside the viewport').toBeLessThanOrEqual(781)
    }
  })
}

test('horizontal ScrollView actually scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto('/')
  await page.getByRole('tab', { name: 'Layout' }).click()

  const result = await page.evaluate(async () => {
    const label = [...document.querySelectorAll('*')]
      .find(el => el.textContent?.trim() === 'Card 1' && el.children.length === 0)
    if (!label) return { error: 'Card 1 not found' }
    const scroller = label.parentElement!.parentElement!.parentElement!
    const before = { scrollW: scroller.scrollWidth, clientW: scroller.clientWidth }
    scroller.scrollLeft = 300
    await new Promise(r => setTimeout(r, 100))
    return { ...before, scrolledTo: scroller.scrollLeft }
  })

  expect(result.error).toBeUndefined()
  expect(result.scrollW!, 'content must exceed the scroller').toBeGreaterThan(result.clientW!)
  expect(result.scrolledTo, 'scrollLeft must move').toBe(300)
})

test('sheet opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto('/')
  await page.getByRole('button', { name: /Full Width Button/ }).click()

  const dialog = page.locator('[role="dialog"]')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(dialog).toBeHidden()
})

test.describe('forced light must beat a dark OS', () => {
  test.use({ colorScheme: 'dark' })

  test('dark-mode toggle drives the tokens both ways', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 })
    await page.goto('/')

    const tokens = () => page.evaluate(() => ({
      cls: document.documentElement.className,
      bg: getComputedStyle(document.documentElement).getPropertyValue('--swift-background').trim(),
    }))

    // system dark, no override
    expect((await tokens()).bg).toBe('#000000')

    await page.getByRole('tab', { name: 'Styles' }).click()
    const toggle = page.locator('[role="switch"][aria-label="Dark Mode"]').last()

    await toggle.click() // -> forced dark
    expect(await tokens()).toMatchObject({ cls: 'swift-dark', bg: '#000000' })

    await toggle.click() // -> forced light, against a dark OS
    expect(await tokens()).toMatchObject({ cls: 'swift-light', bg: '#FFFFFF' })
  })
})
