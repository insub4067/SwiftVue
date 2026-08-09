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
    for (const sel of ['.tab-content', '.nav-content', '.nav-pane']) {
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

test('NavigationLink pushes and the back button pops', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto('/')

  await page.getByRole('button', { name: /General/ }).click()
  await expect(page.getByText('This view was pushed onto the NavigationStack')).toBeVisible()
  await expect(page.locator('h1', { hasText: 'General' })).toBeVisible()

  const back = page.getByLabel('Back')
  await expect(back).toBeVisible()
  await expect(back).toContainText('Components') // names the previous view
  await back.click()

  await expect(page.getByText('This view was pushed onto the NavigationStack')).toBeHidden()
  await expect(page.getByRole('button', { name: /General/ })).toBeVisible()
})

test('popping restores the previous scroll position', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto('/')

  // Clicking auto-scrolls the row into view, so the reference point is the
  // pane's scroll position at the moment of the push.
  await page.getByRole('button', { name: /General/ }).click()
  await expect(page.getByText('This view was pushed onto the NavigationStack')).toBeVisible()
  const atPush = await page.locator('.nav-pane').first().evaluate(el => el.scrollTop)
  expect(atPush).toBeGreaterThan(0)

  await page.getByLabel('Back').click()
  await page.waitForTimeout(400) // let the pop transition settle

  const afterPop = await page.locator('.nav-pane').first().evaluate(el => el.scrollTop)
  expect(afterPop).toBe(atPush)
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

test('TransitionView shows and hides its content', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto('/')

  const box = page.getByTestId('transition-box')
  await expect(box).toBeVisible()

  await page.getByRole('button', { name: 'Hide', exact: true }).click()
  await expect(box).toBeHidden()
  await page.getByRole('button', { name: 'Show', exact: true }).click()
  await expect(box).toBeVisible()
})

test('withAnimation applies the state change', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto('/')

  const extra = page.getByText('View Transitions API', { exact: false })
  await expect(extra).toBeHidden()
  await page.getByRole('button', { name: 'Expand', exact: true }).click()
  await expect(extra).toBeVisible()
  await page.getByRole('button', { name: 'Collapse', exact: true }).click()
  await expect(extra).toBeHidden()
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
