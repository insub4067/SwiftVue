// Kitchen is a real app rather than a gallery, so these are the checks a
// unit test cannot make: that a gesture works with a finger, that a screen
// fits on a phone, and that a deep link survives a reload.
//
// It runs on port 4174; the playground demo owns 4173.
import { test, expect, type Locator, type Page } from '@playwright/test'

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

type Trace = { seen: string[], during: string[], landed: string }

/**
 * How far the row has been dragged, right now — or `gone` if it is no
 * longer there, which is what a completed full swipe leaves behind.
 *
 * The count check is not a nicety. `evaluate` on a locator that matches
 * nothing waits for it to appear, so a helper that reached straight for the
 * element hung for the whole test budget in exactly the case it was written
 * to detect.
 */
async function offsetOf(row: Locator): Promise<string> {
  const content = row.locator('.swipe-content')
  if (await content.count() === 0) return 'gone'
  return String(await content.evaluate((el) => {
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform)
    return Math.round(m.m41)
  }))
}

/**
 * A drag towards the leading edge, the way a finger does it — and a record
 * of what the row did while it happened.
 *
 * Sampled mid-drag on purpose. Reading the row after `pointerup` says
 * nothing: by then it has settled back either way, which is what made the
 * first version of this useless. What matters is whether the row ever
 * followed the finger at all — that separates "the gesture never started"
 * from "the gesture ran and settled wrongly", and no assertion afterwards
 * can tell those apart.
 */
async function swipeRow(page: Page, row: Locator, distance: number): Promise<Trace> {
  const box = (await row.boundingBox())!
  await row.evaluate((el) => {
    const seen: string[] = []
    ;(window as unknown as { __swipe: string[] }).__swipe = seen
    for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture', 'gotpointercapture', 'dragstart', 'selectstart', 'click']) {
      el.addEventListener(type, () => { if (seen[seen.length - 1] !== type) seen.push(type) }, true)
    }
  })

  const y = box.y + box.height / 2
  const from = box.x + box.width - 8
  await page.mouse.move(from, y)
  await page.mouse.down()

  const during: string[] = []
  const STEPS = 6
  for (let step = 1; step <= STEPS; step += 1) {
    await page.mouse.move(from - (distance * step) / STEPS, y)
    during.push(await offsetOf(row))
  }
  await page.mouse.up()

  // Where it lands says which branch of settle() ran, and those are the only
  // remaining candidates: gone means the first action ran, -168 means it
  // parked open, 0 means it decided the gesture was nothing.
  await page.waitForTimeout(400) // the settle animation is 250ms
  const landed = await offsetOf(row)

  const seen = await page.evaluate(() =>
    (window as unknown as { __swipe?: string[] }).__swipe ?? ['nothing recorded'])
  return { seen, during, landed }
}

const explain = (t: Trace, width: number) =>
  `row ${Math.round(width)}px · events ${t.seen.join(' → ')} · followed the finger to ${t.during.join(', ')} · landed at ${t.landed}`

/**
 * The row, not the word.
 *
 * `getByText('Buy milk')` also matches the status line the list writes when
 * something is deleted — `Deleted "Buy milk"` — so a test asserting the
 * text was gone could never pass however well the gesture worked. It cost
 * two rounds to notice that the thing being counted was the app's own
 * announcement of the very deletion under test.
 */
const rowFor = (page: Page, title: string) =>
  page.locator('.swipe-row').filter({ hasText: title })

test('a swipe parks the row open and the revealed action works', async ({ page }) => {
  await fresh(page)

  const row = rowFor(page, 'Buy milk').first()
  const box = await row.boundingBox()
  expect(box, 'the row is laid out').not.toBeNull()

  // Far enough to uncover both 84px actions, well short of the 60% of the
  // row that would run the first one outright.
  const trace = await swipeRow(page, row, 180)
  const why = explain(trace, box!.width)

  expect(trace.during.some(v => Number(v) < -50), `the row followed the finger — ${why}`).toBe(true)
  expect(trace.landed, `parked open rather than deleted — ${why}`).toBe('-168')

  // By class, not by role: the drawn actions are `aria-hidden`, because a
  // screen reader gets the visually hidden fallback buttons instead. Asking
  // for "the Delete button" finds that fallback — which sits off-screen by
  // design, and is what the unit tests already cover.
  const del = row.locator('.swipe-action', { hasText: 'Delete' })
  await expect(del, why).toBeVisible()
  await del.click()

  await expect(rowFor(page, 'Buy milk')).toHaveCount(0)
  await expect(page.getByRole('status')).toContainText('Deleted "Buy milk"')
})

test('a swipe most of the way runs the first action outright', async ({ page }) => {
  await fresh(page)

  const row = rowFor(page, 'Buy milk').first()
  const box = await row.boundingBox()
  expect(box).not.toBeNull()

  // SwiftUI's allowsFullSwipe: past 60% of the row, no tap needed. Measured
  // from the row rather than assumed, so the test does not encode a width.
  const trace = await swipeRow(page, row, Math.round(box!.width * 0.75))
  const why = explain(trace, box!.width)

  expect(trace.during.some(v => Number(v) < -50), `the row followed the finger — ${why}`).toBe(true)
  await expect(rowFor(page, 'Buy milk'), why).toHaveCount(0)
  await expect(page.getByRole('status')).toContainText('Deleted "Buy milk"')
})

// The other gesture the library ships, and the only one with no real-input
// coverage at all until now. It is a headline iOS interaction — the README
// promises the stack "pops on an edge swipe" — and every test behind that
// promise was synthetic.
//
// It is implemented separately from `useSwipe`: pointerdown near the edge,
// pointerup far from it, with no moves in between. That is why it escaped
// the leave-cancel bug that made every SwipeActions drag a no-op, and also
// why nothing would have told us if it had not.
test('an edge swipe pops the screen, and a short one does not', async ({ page }) => {
  await fresh(page)

  await page.getByText('Buy milk').click()
  await expect(page.getByRole('heading', { name: 'Buy milk' })).toBeVisible()

  const pane = page.locator('.nav-pane').last()
  const box = (await pane.boundingBox())!
  const y = box.y + box.height / 2

  // Starting inside the 28px edge but travelling only 40px: under the 70px
  // the gesture asks for, so the screen must stay.
  await page.mouse.move(box.x + 10, y)
  await page.mouse.down()
  await page.mouse.move(box.x + 50, y, { steps: 8 })
  await page.mouse.up()
  await expect(page.getByRole('heading', { name: 'Buy milk' }),
    'a short drag is not a back gesture').toBeVisible()

  await page.mouse.move(box.x + 10, y)
  await page.mouse.down()
  await page.mouse.move(box.x + 200, y, { steps: 12 })
  await page.mouse.up()

  await expect(page.getByRole('button', { name: /New/ }),
    'the stack popped back to the list').toBeVisible()
})

test('a drag that starts away from the edge is not a back gesture', async ({ page }) => {
  await fresh(page)

  await page.getByText('Buy milk').click()
  const heading = page.getByRole('heading', { name: 'Buy milk' })
  await expect(heading).toBeVisible()

  const pane = page.locator('.nav-pane').last()
  const box = (await pane.boundingBox())!
  const y = box.y + box.height / 2

  // Far enough to qualify, but begun in the middle of the screen — which is
  // a scroll or a text selection, not a back.
  await page.mouse.move(box.x + box.width / 2, y)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 200, y, { steps: 12 })
  await page.mouse.up()

  await expect(heading).toBeVisible()
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

// NavigationSplitView is the one component whose whole behaviour is a
// function of how wide the window is, and happy-dom has no width. Its unit
// tests stub `matchMedia`, which proves the branching and nothing about the
// layout — whether two columns genuinely sit side by side is a question
// only a browser can answer, so it is asked here.
const IPAD = { width: 1024, height: 768 }
const IPAD_PORTRAIT = { width: 768, height: 1024 }

async function openLibrary(page: Page, size: { width: number, height: number }) {
  await page.setViewportSize(size)
  await page.goto(KITCHEN)
  await page.evaluate(() => localStorage.clear())
  await page.goto(KITCHEN)
  await page.getByRole('tab', { name: /Library/ }).click()
  await expect(page.getByTestId('filter-title')).toBeVisible()
}

test('on an iPad the sidebar and the detail are side by side', async ({ page }) => {
  await openLibrary(page, IPAD)

  const sidebar = page.locator('[role="tabpanel"]:visible aside')
  const detail = page.locator('[role="tabpanel"]:visible .swift-split-detail')
  const menu = await sidebar.boundingBox()
  const pane = await detail.boundingBox()

  expect(menu, 'the sidebar is laid out').not.toBeNull()
  expect(pane).not.toBeNull()
  expect(menu!.width, 'the column keeps the width it was given').toBeCloseTo(260, 0)
  expect(pane!.x, 'the detail begins where the sidebar ends')
    .toBeGreaterThanOrEqual(menu!.x + menu!.width - 1)
  // Beside, not over: sharing a horizontal band at the same vertical place.
  expect(pane!.y).toBeCloseTo(menu!.y, 0)

  // Nothing is covering anything, so there is nothing to dim or to toggle.
  await expect(page.locator('.swift-split-scrim')).toHaveCount(0)
  await expect(page.locator('[role="tabpanel"]:visible .swift-split-toggle')).toHaveCount(0)
})

test('choosing a filter changes the detail without leaving the screen', async ({ page }) => {
  await openLibrary(page, IPAD)

  await expect(page.getByTestId('filter-title')).toHaveText('All')
  await page.getByRole('button', { name: 'Done', exact: true }).click()

  await expect(page.getByTestId('filter-title')).toHaveText('Done')
  // The menu is still there; nothing was pushed over anything.
  await expect(page.getByRole('button', { name: 'All', exact: true })).toBeVisible()
})

test('at iPad portrait width the sidebar is still a column', async ({ page }) => {
  // 768 is the breakpoint itself, and `min-width` includes it — the boundary
  // is exactly where an off-by-one would show.
  await openLibrary(page, IPAD_PORTRAIT)

  await expect(page.locator('[role="tabpanel"]:visible aside')).toBeVisible()
  await expect(page.locator('.swift-split-scrim')).toHaveCount(0)
})

test('on a phone the sidebar comes over the detail and can be put away', async ({ page }) => {
  await openLibrary(page, { width: 390, height: 780 })

  const sidebar = page.locator('[role="tabpanel"]:visible aside')
  const toggle = page.locator('[role="tabpanel"]:visible .swift-split-toggle')

  await expect(toggle, 'unreachable otherwise, so the library draws one').toBeVisible()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  const scrim = page.locator('.swift-split-scrim')
  await expect(scrim).toBeVisible()

  // Over the detail rather than beside it: both start at the same edge.
  const menu = (await sidebar.boundingBox())!
  const pane = (await page.locator('[role="tabpanel"]:visible .swift-split-detail').boundingBox())!
  expect(menu.x).toBeCloseTo(pane.x, 0)

  await scrim.click()
  await expect(scrim).toHaveCount(0)
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
})

test('choosing a filter on a phone puts the menu away with it', async ({ page }) => {
  await openLibrary(page, { width: 390, height: 780 })

  await page.locator('[role="tabpanel"]:visible .swift-split-toggle').click()
  await page.getByRole('button', { name: 'Open', exact: true }).click()

  // Otherwise the answer sits behind the question.
  await expect(page.locator('.swift-split-scrim')).toHaveCount(0)
  await expect(page.getByTestId('filter-title')).toHaveText('Open')
})

test('the menu takes the keyboard while it is over the content, and Escape shuts it', async ({ page }) => {
  await openLibrary(page, { width: 390, height: 780 })

  await page.locator('[role="tabpanel"]:visible .swift-split-toggle').click()
  await expect(page.locator('.swift-split-scrim')).toBeVisible()

  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim())
  expect(focused, 'focus moved into the menu').toBe('All')

  await page.keyboard.press('Escape')
  await expect(page.locator('.swift-split-scrim')).toHaveCount(0)
})

for (const width of [320, 390, 768, 1024]) {
  test(`the library screen fits a ${width}px window`, async ({ page }) => {
    await openLibrary(page, { width, height: 780 })
    expect(await overflowOffenders(page)).toEqual([])
  })
}
