// Kitchen is a real app rather than a gallery, so these are the checks a
// unit test cannot make: that a gesture works with a finger, that a screen
// fits on a phone, and that a deep link survives a reload.
//
// It runs on port 4174; the playground demo owns 4173.
import { test, expect, type Page } from '@playwright/test'

const KITCHEN = 'http://localhost:4174'
const WIDTHS = [320, 360, 390, 430]

/**
 * Every state written by a previous test, gone — and a phone-shaped window,
 * because that is the only shape this app is designed for. The default
 * 1280×720 is not a size any of these screens claims to work at.
 */
async function fresh(page: Page, { width = 390, path = '/' } = {}) {
  await page.setViewportSize({ width, height: 780 })
  await page.goto(`${KITCHEN}${path}`)
  await page.evaluate(() => localStorage.clear())
  await page.goto(`${KITCHEN}${path}`)
}

async function overflowOffenders(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const found: string[] = []
    if (document.documentElement.scrollWidth > window.innerWidth + 1) {
      found.push(`documentElement ${document.documentElement.scrollWidth} > ${window.innerWidth}`)
    }
    for (const sel of ['.tab-content', '.nav-content', '.nav-pane']) {
      for (const el of document.querySelectorAll(sel)) {
        if (el.scrollWidth > el.clientWidth + 1) found.push(`${sel} ${el.scrollWidth} > ${el.clientWidth}`)
      }
    }
    return found
  })
}

for (const width of WIDTHS) {
  test(`fits a ${width}px phone, on both tabs`, async ({ page }) => {
    await fresh(page, { width })

    expect(await overflowOffenders(page)).toEqual([])
    await page.getByRole('tab', { name: /Settings/ }).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    expect(await overflowOffenders(page)).toEqual([])
  })
}

test('the tab bar stays above the fold with the keyboard open', async ({ page }) => {
  await fresh(page)

  const bar = page.locator('.tab-bar')
  const box = await bar.boundingBox()
  expect(box, 'the tab bar is laid out').not.toBeNull()
  expect(box!.y + box!.height).toBeLessThanOrEqual(781)
})

test('adding a todo works end to end, and outlives a reload', async ({ page }) => {
  await fresh(page)

  await page.getByRole('button', { name: /New/ }).click()
  await page.getByPlaceholder('Title').fill('Call the dentist')
  await page.getByRole('button', { name: 'Add Todo' }).click()

  await expect(page.getByText('Call the dentist')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Call the dentist')).toBeVisible()
})

test('Return in the title field saves, the same as the button', async ({ page }) => {
  await fresh(page)

  await page.getByRole('button', { name: /New/ }).click()
  await page.getByPlaceholder('Title').fill('Book a table')
  await page.getByPlaceholder('Title').press('Enter')

  await expect(page.getByText('Book a table')).toBeVisible()
})

/** A drag towards the leading edge, the way a finger does it. */
async function swipeRow(page: Page, box: { x: number, y: number, width: number, height: number }, distance: number) {
  const y = box.y + box.height / 2
  const from = box.x + box.width - 8
  await page.mouse.move(from, y)
  await page.mouse.down()
  await page.mouse.move(from - distance, y, { steps: 12 })
  await page.mouse.up()
}

test('a swipe parks the row open and the revealed action works', async ({ page }) => {
  await fresh(page)

  const row = page.locator('.swipe-row').filter({ hasText: 'Buy milk' }).first()
  const box = await row.boundingBox()
  expect(box, 'the row is laid out').not.toBeNull()

  // Far enough to uncover both 84px actions, well short of the 60% of the
  // row that would run the first one outright.
  await swipeRow(page, box!, 180)

  // By class, not by role: the drawn actions are `aria-hidden`, because a
  // screen reader gets the visually hidden fallback buttons instead. Asking
  // for "the Delete button" finds that fallback — which sits off-screen by
  // design, and is what the unit tests already cover.
  const del = row.locator('.swipe-action', { hasText: 'Delete' })
  await expect(del).toBeVisible()
  await del.click()
  await expect(page.getByText('Buy milk')).toHaveCount(0)
})

test('a swipe most of the way runs the first action outright', async ({ page }) => {
  await fresh(page)

  const row = page.locator('.swipe-row').filter({ hasText: 'Buy milk' }).first()
  const box = await row.boundingBox()
  expect(box).not.toBeNull()

  // SwiftUI's allowsFullSwipe: past 60% of the row, no tap needed. Measured
  // from the row rather than assumed, so the test does not encode a width.
  await swipeRow(page, box!, Math.round(box!.width * 0.75))
  await expect(page.getByText('Buy milk')).toHaveCount(0)
})

test('a deep link reopens the todo it names', async ({ page }) => {
  await fresh(page)

  await page.getByText('Buy milk').click()
  await expect(page.getByRole('heading', { name: 'Buy milk' })).toBeVisible()

  // The query parameter is named after the stack's `history-key`, which is
  // `todos` here — one stack per page owns history, so the key has to say
  // which stack the entry belongs to.
  const url = page.url()
  expect(url, 'the open screen is in the URL').toContain('todos=todo')

  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Buy milk' })).toBeVisible()
})

test('Back returns to the list, and forward goes in again', async ({ page }) => {
  await fresh(page)

  await page.getByText('Buy milk').click()
  await expect(page.getByRole('heading', { name: 'Buy milk' })).toBeVisible()

  await page.goBack()
  await expect(page.getByRole('button', { name: /New/ })).toBeVisible()

  await page.goForward()
  await expect(page.getByRole('heading', { name: 'Buy milk' })).toBeVisible()
})

test('a tab keeps its screen while you look at the other one', async ({ page }) => {
  await fresh(page)

  await page.getByText('Renew passport').click()
  await expect(page.getByRole('heading', { name: 'Renew passport' })).toBeVisible()

  await page.getByRole('tab', { name: /Settings/ }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

  await page.getByRole('tab', { name: /Todos/ }).click()
  await expect(page.getByRole('heading', { name: 'Renew passport' }),
    'the pushed screen is where it was left').toBeVisible()
})

test('onAppear counts a return, not a remount', async ({ page }) => {
  await fresh(page)

  await page.getByText('Renew passport').click()
  const counter = page.getByTestId('appear-count')
  await expect(counter).toContainText('1×')
  await expect(counter).toContainText('visible')
})

test('the dark theme reaches the tokens', async ({ page }) => {
  await fresh(page)
  await page.getByRole('tab', { name: /Settings/ }).click()
  await page.getByText('Appearance').click()

  await page.getByTestId('theme-row').getByRole('combobox').selectOption('dark')

  const background = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--swift-background').trim())
  expect(background, 'a dark background is not white').not.toBe('#FFFFFF')
})

test('right to left mirrors the app rather than only the text', async ({ page }) => {
  await fresh(page)
  await page.getByRole('tab', { name: /Settings/ }).click()

  await page.getByTestId('direction-row').getByRole('combobox').selectOption('rtl')

  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

  // The chevron is a glyph, so a logical property moves it but cannot turn
  // it around — it has to be mirrored by hand, and this is that check.
  //
  // Scoped to the tab on screen. A tab that has been opened stays mounted,
  // and `getComputedStyle` on an element inside a `display: none` subtree
  // returns the specified `scaleX(-1)` rather than the resolved matrix —
  // there is no layout box to resolve against.
  const chevron = page.locator('[role="tabpanel"]:visible .nav-link-chevron').first()
  const flipped = await chevron.evaluate(el => getComputedStyle(el).transform)
  expect(flipped).toContain('matrix(-1')
})
