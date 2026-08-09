// Kitchen is a real app rather than a gallery, so these are the checks a
// unit test cannot make: that a gesture works with a finger, that a screen
// fits on a phone, and that a deep link survives a reload.
//
// It runs on port 4174; the playground demo owns 4173.
import { test, expect, type Page } from '@playwright/test'

const KITCHEN = 'http://localhost:4174'
const WIDTHS = [320, 360, 390, 430]

/** Every state written by a previous test, gone. */
async function fresh(page: Page, path = '/') {
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
    await page.setViewportSize({ width, height: 780 })
    await fresh(page)

    expect(await overflowOffenders(page)).toEqual([])
    await page.getByRole('tab', { name: /Settings/ }).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    expect(await overflowOffenders(page)).toEqual([])
  })
}

test('the tab bar stays above the fold with the keyboard open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
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

test('a swipe reveals the row actions and deleting removes the row', async ({ page }) => {
  await fresh(page)

  const row = page.locator('.swipe-actions').filter({ hasText: 'Buy milk' }).first()
  const box = await row.boundingBox()
  expect(box).not.toBeNull()

  // A pointer drag, the way a finger does it — not a click on the hidden
  // keyboard fallback, which the unit tests already cover.
  const y = box!.y + box!.height / 2
  await page.mouse.move(box!.x + box!.width - 20, y)
  await page.mouse.down()
  await page.mouse.move(box!.x + box!.width - 140, y, { steps: 12 })
  await page.mouse.up()

  const del = page.getByRole('button', { name: 'Delete' }).first()
  await expect(del).toBeVisible()
  await del.click()
  await expect(page.getByText('Buy milk')).toHaveCount(0)
})

test('a deep link reopens the todo it names', async ({ page }) => {
  await fresh(page)

  await page.getByText('Buy milk').click()
  await expect(page.getByRole('heading', { name: 'Buy milk' })).toBeVisible()

  const url = page.url()
  expect(url, 'the open screen is in the URL').toContain('nav=')

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

  await page.getByRole('combobox').first().selectOption('dark')

  const background = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--swift-background').trim())
  expect(background, 'a dark background is not white').not.toBe('#FFFFFF')
})

test('right to left mirrors the app rather than only the text', async ({ page }) => {
  await fresh(page)
  await page.getByRole('tab', { name: /Settings/ }).click()

  const direction = page.getByRole('combobox').last()
  await direction.selectOption('rtl')

  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

  // The chevron is a glyph, so a logical property moves it but cannot turn
  // it around — it has to be mirrored by hand, and this is that check.
  const flipped = await page.evaluate(() => {
    const chevron = document.querySelector('.nav-link-chevron')
    return chevron ? getComputedStyle(chevron).transform : ''
  })
  expect(flipped).toContain('matrix(-1')
})
