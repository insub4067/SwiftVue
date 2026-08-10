// The same audit as `tests/a11y/axe.test.ts`, in a real browser.
//
// The unit run is the fast gate and covers every component, but happy-dom
// lays nothing out, so the rules that read geometry are switched off there
// and only work here: whether a scrollable region can be reached from the
// keyboard, whether an element is actually hidden or merely off-screen,
// whether the focus outline exists at all.
//
// Worth being exact about what neither of them is. axe finds roughly a
// third of what a human audit finds. It cannot see whether an announcement
// makes sense, whether focus lands somewhere sensible, or whether the app
// is usable with a screen reader at all — `docs/SUPPORT.md` still records
// those as unchecked, because they still are.
//
// So: a floor, not a certificate.
import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Page } from '@playwright/test'

const KITCHEN = 'http://localhost:4174'

/** WCAG 2.1 A and AA — the level a public component library is judged at. */
const STANDARD = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

/**
 * The theme is Apple's iOS system palette, and a good deal of it does not
 * reach AA: `systemBlue` on white is 4.02:1 against a 4.5:1 bar, so a
 * filled blue button with white text fails — as it does in iOS itself.
 * Reproducing that is the library's whole purpose, so the rule is off here
 * rather than the palette being quietly corrected.
 *
 * Off, but not unmeasured: `tests/utils/contrast.test.ts` pins every ratio
 * in both themes and fails if any of them gets worse, and `docs/SUPPORT.md`
 * publishes the figures. This is the one rule in the standard that SwiftVue
 * knowingly does not meet, and it is a decision rather than an oversight.
 */
const KNOWN_DIVERGENCE = ['color-contrast']

async function audit(page: Page, within?: string) {
  const builder = new AxeBuilder({ page }).withTags(STANDARD).disableRules(KNOWN_DIVERGENCE)
  return (within ? builder.include(within) : builder).analyze()
}

/** Every violation, with the node that caused it — a count alone says nothing. */
const report = (results: Awaited<ReturnType<typeof audit>>) =>
  results.violations
    .map(v => `${v.id} (${v.impact}) — ${v.help}\n${v.nodes.map(n => `      ${n.html.slice(0, 120)}`).join('\n')}`)
    .join('\n\n')

async function open(page: Page, { width = 390, height = 780 } = {}) {
  await page.setViewportSize({ width, height })
  await page.goto(KITCHEN)
  await page.evaluate(() => localStorage.clear())
  await page.goto(KITCHEN)
}

test('the todo list has no violations', async ({ page }) => {
  await open(page)
  const results = await audit(page)
  expect(report(results), 'axe over the list').toBe('')
})

test('the settings screen has no violations', async ({ page }) => {
  await open(page)
  await page.getByRole('tab', { name: /Settings/ }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

  const results = await audit(page)
  expect(report(results), 'axe over settings').toBe('')
})

test('a pushed screen has no violations', async ({ page }) => {
  await open(page)
  await page.getByText('Buy milk').click()
  await expect(page.getByRole('heading', { name: 'Buy milk' })).toBeVisible()

  const results = await audit(page)
  expect(report(results), 'axe over the detail').toBe('')
})

// A dialog is where accessibility usually goes wrong: no name, no modal
// flag, nothing focusable, or the page behind it still in the reading order.
test('the new-todo sheet has no violations', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: /New/ }).click()
  await expect(page.getByPlaceholder('Title')).toBeVisible()

  const results = await audit(page)
  expect(report(results), 'axe over the sheet').toBe('')
})

test('the delete-everything alert has no violations', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'Delete All' }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()

  const results = await audit(page)
  expect(report(results), 'axe over the alert').toBe('')
})

test('the iPad sidebar has no violations, as a column', async ({ page }) => {
  await open(page, { width: 1024, height: 768 })
  await page.getByRole('tab', { name: /Library/ }).click()
  await expect(page.getByTestId('filter-title')).toBeVisible()

  const results = await audit(page)
  expect(report(results), 'axe over the split view').toBe('')
})

test('and as an overlay', async ({ page }) => {
  await open(page)
  await page.getByRole('tab', { name: /Library/ }).click()
  await page.locator('[role="tabpanel"]:visible .swift-split-toggle').click()
  await expect(page.locator('.swift-split-scrim')).toBeVisible()

  const results = await audit(page)
  expect(report(results), 'axe over the open menu').toBe('')
})

// The dark theme swaps every token and re-renders the tree, so it is a
// different DOM and a separate question — the contrast half of it is
// answered arithmetically in `tests/utils/contrast.test.ts` instead.
test('the dark theme has no violations', async ({ page }) => {
  await open(page)
  await page.getByRole('tab', { name: /Settings/ }).click()
  await page.getByText('Appearance').click()
  await page.getByTestId('theme-row').getByRole('combobox').selectOption('dark')

  const results = await audit(page)
  expect(report(results), 'axe over the dark theme').toBe('')
})

test('right to left has no violations', async ({ page }) => {
  await open(page)
  await page.getByRole('tab', { name: /Settings/ }).click()
  await page.getByTestId('direction-row').getByRole('combobox').selectOption('rtl')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

  const results = await audit(page)
  expect(report(results), 'axe in Arabic reading order').toBe('')
})
