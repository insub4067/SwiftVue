// Enforces docs/LAYOUT.md in a real browser. These are the failures that
// happy-dom unit tests cannot see: every layout blowout so far shipped with
// the whole unit suite green.
//
// The demo is organized as Section lists whose NavigationLinks push each
// component demo, so most tests push a destination first.
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

/**
 * The rows on the tab that is showing.
 *
 * A tab is built the first time it is selected and kept from then on, so
 * every tab visited so far still has its rows in the DOM. An unscoped
 * `.nav-link` picks the first one in document order, which after a tab
 * switch belongs to a tab nobody can see — and clicking it waits for a
 * hidden element forever.
 */
function rowsOnScreen(page: Page) {
  return page.locator('[role="tabpanel"]:visible').locator('.nav-link')
}

async function push(page: Page, row: string | RegExp) {
  await page.getByRole('button', { name: row }).click()
  await page.waitForTimeout(400) // push transition
}

for (const width of WIDTHS) {
  test(`no horizontal overflow on any tab root at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 780 })
    await page.goto('/')

    for (const tab of TABS) {
      await page.getByRole('tab', { name: tab }).click()
      await page.waitForTimeout(150)

      await expect.poll(
        () => overflowOffenders(page),
        { message: `${tab} tab at ${width}px`, timeout: 3_000 },
      ).toEqual([])

      const bar = page.locator('.tab-bar')
      const box = await bar.boundingBox()
      expect(box, 'tab bar must be visible').not.toBeNull()
      expect(box!.y + box!.height, 'tab bar must sit inside the viewport').toBeLessThanOrEqual(781)
    }
  })
}

// One test per tab: walking every screen in all four blows a single test's
// budget, and a failure should name the tab that broke.
for (const tab of TABS) {
  test(`every pushed ${tab} screen stays within a 320px viewport`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 780 })
    await page.goto('/')
    await page.getByRole('tab', { name: tab }).click()
    await page.waitForTimeout(150)

    const rows = rowsOnScreen(page)
    const count = await rows.count()
    for (let i = 0; i < count; i++) {
      await rows.nth(i).click()
      const back = page.getByLabel('Back')
      const pushed = await back.waitFor({ state: 'visible', timeout: 1500 }).then(() => true, () => false)

      if (pushed) {
        const row = await rows.nth(i).textContent().catch(() => `row ${i}`)
        // Poll rather than sample once after a fixed wait. The pane arriving
        // sits at translateX(100%) mid-push, and WebKit counts that towards
        // the scroll width — so a single sample can catch the animation
        // instead of the layout. A real overflow never settles, so the gate
        // is as strict as before.
        await expect.poll(
          () => overflowOffenders(page),
          { message: `${tab} → ${row}`, timeout: 3_000 },
        ).toEqual([])
        await back.click()
        await page.waitForTimeout(400)
      } else {
        // rows without a destination open an overlay instead (e.g. Sheet)
        const close = page.getByRole('button', { name: 'Close' })
        if (await close.isVisible().catch(() => false)) await close.click()
      }
    }
  })
}

test('horizontal ScrollView actually scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto('/')
  await page.getByRole('tab', { name: 'Layout' }).click()
  await push(page, /ScrollView/)

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

  await push(page, /Typography/)
  // .first(): the collapsed source sample quotes the same string
  await expect(page.getByText('Large Title').first()).toBeVisible()
  await expect(page.locator('h1', { hasText: 'Typography' })).toBeVisible()

  const back = page.getByLabel('Back')
  await expect(back).toBeVisible()
  await expect(back).toHaveClass(/swift-navigation-back-button/)
  await expect(back).toHaveText('')
  await back.click()

  await expect(page.getByText('Large Title')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Typography/ })).toBeVisible()
})

// browser-back is a claim about the real browser, so only a real browser can
// check it: Back pops instead of leaving the app, and Forward comes back.
test('browser Back and Forward drive the stack', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto('/')

  await push(page, /Typography/)
  await expect(page.locator('h1', { hasText: 'Typography' })).toBeVisible()

  await page.goBack()
  await expect(page.locator('h1', { hasText: 'Typography' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Typography/ }), 'still in the app')
    .toBeVisible()

  await page.goForward()
  await expect(page.locator('h1', { hasText: 'Typography' })).toBeVisible()
})

// The claim a deep link makes is about a cold load, so the test has to be a
// cold load — not a push followed by an assertion about the URL.
test('a shared link reopens the screen it names', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto('/')

  await push(page, /Typography/)
  await expect(page).toHaveURL(/components=typography/)

  const shared = page.url()
  await page.goto('about:blank')
  await page.goto(shared)

  await expect(page.locator('h1', { hasText: 'Typography' })).toBeVisible()
  await expect(page.getByLabel('Back'), 'reopened as a pushed screen').toBeVisible()
})

test('a link into another tab opens that tab', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto('/?tab=layout&layout=vstack')

  await expect(page.getByRole('tab', { name: 'Layout' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('h1', { hasText: 'VStack' })).toBeVisible()
})

// Restoring is where the user already is. If it pushed a history entry,
// Back would land them on the screen they are already looking at.
test('Back from a reopened screen leaves it', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto('/?tab=components&components=typography')
  await expect(page.locator('h1', { hasText: 'Typography' })).toBeVisible()

  await page.goBack()
  await expect(page.locator('h1', { hasText: 'Typography' })).toHaveCount(0)
})

test('popping restores the previous scroll position', async ({ page }) => {
  // shallow viewport so the Components root actually scrolls
  await page.setViewportSize({ width: 390, height: 560 })
  await page.goto('/')

  // Clicking auto-scrolls the row into view, so the reference point is the
  // pane's scroll position at the moment of the push.
  await push(page, /Pull to Refresh/)
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
  await page.getByRole('button', { name: /Sheet$/ }).click()

  const dialog = page.locator('[role="dialog"]')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(dialog).toBeHidden()
})

test('TransitionView shows and hides its content', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto('/')
  await push(page, /Animation/)

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
  await push(page, /Animation/)

  const extra = page.getByText('This extra content appears when the state changes', { exact: false })
  await expect(extra).toBeHidden()
  await page.getByRole('button', { name: 'Expand', exact: true }).click()
  await expect(extra).toBeVisible()
  await page.getByRole('button', { name: 'Collapse', exact: true }).click()
  await expect(extra).toBeHidden()
})

// The regression the real device caught. withAnimation used the View
// Transitions API, which snapshots the page and cross-fades it — and on iOS
// Safari an unchanged page still went translucent at the crossfade's midpoint,
// so the whole screen washed toward its background. The fix moves the live
// element with the Web Animations API instead, which has no snapshot to bleed.
// So the proof is structural: startViewTransition is never called, and the
// move runs as a real animation on the element.
test('withAnimation moves the live element, never snapshots the page', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __vtCalls: number }
    w.__vtCalls = 0
    const doc = document as Document & { startViewTransition?: (cb: () => unknown) => unknown }
    if (doc.startViewTransition) {
      const original = doc.startViewTransition.bind(doc)
      doc.startViewTransition = (cb: () => unknown) => { w.__vtCalls++; return original(cb) }
    }
  })
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto('/')
  await push(page, /Animation/)

  // A shuffle reorders the swatches, so they move — the case that flashed.
  await page.getByRole('button', { name: 'Shuffle (spring)' }).click()

  // Mid-move, the Web Animations API is driving real animations.
  await expect.poll(
    () => page.evaluate(() => document.getAnimations().length),
    { message: 'the FLIP runs as Web Animations', timeout: 2000 },
  ).toBeGreaterThan(0)

  // And the page was never snapshotted — that snapshot was the flash.
  const vtCalls = await page.evaluate(() => (window as unknown as { __vtCalls: number }).__vtCalls)
  expect(vtCalls, 'View Transitions API must not be used').toBe(0)
})

test('collapsible Section folds and reopens with state intact', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto('/')
  await push(page, /Section & Collapsible/)

  const header = page.getByRole('button', { name: 'Advanced' })
  const body = page.locator('.section-body', { has: page.getByLabel('Notifications') })

  await expect(header).toHaveAttribute('aria-expanded', 'true')

  // flip a control inside, collapse, reopen — the toggle must keep its state
  const toggle = page.getByRole('switch', { name: 'Notifications' })
  const before = await toggle.getAttribute('aria-checked')
  await toggle.click()

  await header.click()
  await expect(header).toHaveAttribute('aria-expanded', 'false')
  await expect(body).toHaveClass(/collapsed/)

  await header.click()
  await expect(header).toHaveAttribute('aria-expanded', 'true')
  await expect(toggle).toHaveAttribute('aria-checked', before === 'true' ? 'false' : 'true')
})

test('pull gesture triggers refreshable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto('/')
  await push(page, /Pull to Refresh/)

  // The gesture is touch-only by design: only `touchmove` can preventDefault
  // the native overscroll that a pull has to take over from. A browser that
  // cannot build a touch sequence therefore cannot exercise it.
  //
  // The probe builds exactly what the gesture below builds. An earlier one
  // only tried `new TouchEvent('touchstart')`, which WebKit allows — it is
  // the `Touch` in the list that it refuses, so the probe passed and the
  // gesture still threw.
  const canTouch = await page.evaluate(() => {
    try {
      new TouchEvent('touchstart', {
        touches: [new Touch({ identifier: 1, target: document.body, clientX: 0, clientY: 0 })],
      })
      return true
    } catch {
      return false
    }
  })
  test.skip(!canTouch, 'this browser cannot construct a Touch; the gesture is touch-only by design')

  await page.getByTestId('refresh-area').locator('div').first().evaluate(async (scroller) => {
    const touch = (type: string, y: number) => scroller.dispatchEvent(new TouchEvent(type, {
      bubbles: true,
      cancelable: true,
      touches: type === 'touchend' ? [] : [new Touch({ identifier: 1, target: scroller, clientX: 100, clientY: y })],
    }))
    touch('touchstart', 100)
    for (let y = 110; y <= 260; y += 30) {
      touch('touchmove', y)
      await new Promise(r => setTimeout(r, 16))
    }
    touch('touchend', 260)
  })

  await expect(page.getByText(/Refreshed at/)).toBeVisible({ timeout: 3000 })
})

test('debounced publisher settles on the final input', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto('/')
  await page.getByRole('tab', { name: 'Controls' }).click()
  await push(page, /onChange & Combine/)

  await page.getByPlaceholder('Search...').fill('swift')
  // inside the debounce window nothing is delivered yet
  await expect(page.getByTestId('debounced')).toContainText('—')
  await expect(page.getByTestId('debounced')).toContainText('swift', { timeout: 2000 })
})

// One test per tab: a single pass over all 27 screens ran past the 30s
// default, and a failure could not name the tab it happened in.
for (const tab of TABS) {
  test(`${tab} screens ship a source sample and link to the implementation`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 })
    await page.goto('/')
    await page.getByRole('tab', { name: tab }).click()
    await page.waitForTimeout(150)

    const rows = rowsOnScreen(page)
    for (let i = 0; i < await rows.count(); i++) {
      await rows.nth(i).click()
      const back = page.getByLabel('Back')
      const pushed = await back.waitFor({ state: 'visible', timeout: 1500 }).then(() => true, () => false)
      if (!pushed) {
        const close = page.getByRole('button', { name: 'Close' })
        if (await close.isVisible().catch(() => false)) await close.click()
        continue
      }

      // Buried panes stay mounted, so scope to the one on top of the stack.
      const pane = page.locator('.nav-pane:not(.nav-pane--under)')
      const title = await page.locator('h1').first().textContent()
      const source = pane.getByRole('button', { name: 'Source' })
      await expect(source, `${title} must offer its source`).toBeVisible()

      // collapsed by default so it never buries the demo itself
      await expect(source).toHaveAttribute('aria-expanded', 'false')
      await source.click()
      await expect(pane.locator('.code-block')).toBeVisible()
      await expect(pane.locator('.code-link').first()).toHaveAttribute(
        'href', /^https:\/\/github\.com\/insub4067\/SwiftVue\/blob\/main\//)

      await back.click()
      await page.waitForTimeout(350)
    }
  })
}

test('the tab badge tracks its count and disappears at zero', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto('/')
  await push(page, /Tab Badge/)

  const badge = page.locator('.tab-badge')
  await expect(badge).toHaveText('3')

  // The badge lives on the tab bar, outside the pane doing the stepping.
  const minus = page.locator('.nav-pane:not(.nav-pane--under)').getByRole('button', { name: 'Decrease Unread' })
  for (let i = 0; i < 3; i++) await minus.click()
  await expect(badge).toHaveCount(0)
})

test('a right click opens the context menu at the pointer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto('/')
  await push(page, /Context Menu/)

  await page.locator('.context-menu-target').click({ button: 'right' })
  const menu = page.getByRole('menu')
  await expect(menu).toBeVisible()

  await menu.getByRole('menuitem', { name: 'Copy' }).click()
  await expect(page.getByTestId('context-choice')).toContainText('Copy')
  await expect(menu).toHaveCount(0)
})

// The dial is an arc, not a number, so only a real renderer can say whether
// the value actually moved it.
test('the gauge sweeps as its value changes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto('/')
  await push(page, /Gauge/)

  const dial = page.locator('.gauge-fill').first()
  const sweep = () => dial.evaluate(el => Number(el.getAttribute('stroke-dasharray')!.split(' ')[0]))
  const before = await sweep()

  const slider = page.locator('.nav-pane:not(.nav-pane--under) input[type="range"]').first()
  await slider.fill('1')
  await expect.poll(sweep).toBeGreaterThan(before)
})

// A covered pane stays mounted, so only a real push and pop can show that
// onAppear fires again rather than staying at one.
test('onAppear fires again when a screen is returned to', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto('/')
  await push(page, /onAppear/)

  const appears = page.getByTestId('appear-count')
  const disappears = page.getByTestId('disappear-count')
  await expect(appears).toHaveText('1')
  await expect(disappears).toHaveText('0')

  await push(page, /화면 하나 더 쌓기/)
  await page.getByLabel('Back').click()
  await page.waitForTimeout(400)

  await expect(appears, 'covered, then shown again').toHaveText('2')
  await expect(disappears).toHaveText('1')
})

test('ZStack places children on the axis the alignment names', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 })
  await page.goto('/')
  await page.getByRole('tab', { name: 'Layout' }).click()
  await push(page, /ZStack & Spacer/)

  // The avatar ZStack pins its badge to bottomTrailing over a 70px circle.
  const placed = await page.evaluate(() => {
    const zstacks = [...document.querySelectorAll('.nav-pane:not(.nav-pane--under) div')]
      .filter(el => getComputedStyle(el).display === 'grid')
    return zstacks.map(z => {
      const cs = getComputedStyle(z)
      const box = z.getBoundingClientRect()
      const last = z.lastElementChild!.getBoundingClientRect()
      return {
        justifyItems: cs.justifyItems,
        alignItems: cs.alignItems,
        // where the topmost child sits inside the stack
        x: Math.round(last.left - box.left),
        y: Math.round(last.top - box.top),
        w: Math.round(box.width - last.width),
        h: Math.round(box.height - last.height),
      }
    })
  })

  expect(placed.length).toBeGreaterThan(0)
  const bottomTrailing = placed.find(p => p.justifyItems === 'end' && p.alignItems === 'end')
  expect(bottomTrailing, 'the avatar stack uses bottomTrailing').toBeTruthy()
  // end/end means the child sits at the far corner, not the middle
  expect(bottomTrailing!.x).toBe(bottomTrailing!.w)
  expect(bottomTrailing!.y).toBe(bottomTrailing!.h)
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
