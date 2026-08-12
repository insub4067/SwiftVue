# What SwiftVue runs on

Two kinds of claim get made about support, and they are worth keeping apart:

- **Verified** — something in CI fails if it stops being true.
- **Expected** — it should work, nothing checks that it does. If you are
  betting a product on one of these, test it yourself first.

Everything below is labelled one or the other. Nothing is listed as
supported on the strength of an intention.

## Node

| Version | Status |
| --- | --- |
| 22 (LTS) | **Verified** — full check suite |
| 24 (LTS) | **Verified** — full check suite |
| 26 (Current) | **Verified** — full check suite |
| 20 and below | **Not supported.** `engines` refuses the install |

The three run as a matrix on every push and pull request: type-check, lint,
the whole unit suite, and a packaging check that builds a real consumer app
against the packed tarball. Current is in the matrix on purpose — a runtime
change should break the library's own CI, not somebody's install.

Node matters only to build and test the library. A built app has no Node in
it.

## Vue

| Version | Status |
| --- | --- |
| 3.5 and above | **Verified** — the peer range, and what CI installs |
| 3.4 and below | **Not supported.** `useId()` arrived in 3.5, and five components rely on it for stable ids across server and client |
| 2.x | Never |

Vue is a peer dependency, so your app's copy is the only one loaded.

## Browsers

| Engine | Status |
| --- | --- |
| Chromium (current) | **Verified** — the E2E suite, every push |
| WebKit (current, desktop) | **Verified** — the E2E suite, every push |
| Firefox | **Expected.** Nothing in the library is Gecko-specific, and nothing tests it |
| Safari on iOS | **Expected**, and the one to be careful about — see below |
| Chrome on Android | **Expected** |
| Internet Explorer | Never |

WebKit is in the matrix because Safari is where this project's expensive
bugs have been: `position: fixed` measured against the large viewport,
viewport units lying mid keyboard animation. Chromium sees none of them.
Both engines run as separate jobs so a Chromium pass cannot hide a Safari
failure.

**Desktop WebKit is not iOS Safari.** Playwright's WebKit runs on Linux and
differs from a phone in the two places that have actually broken layout: the
viewport is not resized by a keyboard, and the dynamic toolbar does not
exist. Touch is enabled so the swipe and pull gestures are reachable, but
they are being driven by a synthetic pointer. Take the E2E pass as evidence
that the engine agrees with Chromium, not that an iPhone will.

Real-device testing is done by hand before a release and is not a gate. A
mobile-emulation project is the obvious next step and has not been written.

### Gestures, and what a synthetic event cannot show you

Worth its own heading, because this is where the library's worst bug hid.
`SwipeActions` had forty passing unit tests and the gesture had **never
completed in a browser** — a real drag makes the browser fire a
`pointerleave` from an element the pointer never left, and nothing you
dispatch by hand ever includes it. The same blind spot hid the `click` a
drag produces afterwards.

So gestures are ranked by what actually drives them:

| Gesture | Driven by |
| --- | --- |
| Swipe actions on a row | **A real pointer**, in both engines |
| Edge-swipe back | **A real pointer**, in both engines |
| Pull to refresh | **Synthetic touch events.** Playwright can tap but cannot drag a touch, so this one cannot be driven for real — treat its passing test as weaker evidence than the two above |

Pull to refresh is touch-only by design, as it is on iOS: there is no
mouse or trackpad path into it.

### The floor, for older browsers

Nothing enforces this, so treat it as the boundary of "expected" rather
than a supported range. The build target is Vite's default `modules`
(Chrome 87, Edge 88, Firefox 78, Safari 14), and the CSS raises the Safari
line: `inset-inline-start` and friends need **Safari 14.1**. The library
uses no `:has()`, no container queries, no `dvh`, no `structuredClone`, and
no observer API — the floor is set by logical properties and custom
properties, both of which are years old.

## Server-side rendering

**Verified.** A Node-environment test renders every component and runs every
composable through `renderToString`, where `window`, `document` and
`localStorage` genuinely do not exist. A component that reaches for a
browser global during setup or render fails there.

Hydration mismatch is *not* covered: the test asserts that SSR produces
markup, not that the client agrees with it.

## Accessibility

SwiftVue does not claim a WCAG conformance level. An automated audit runs
against 2.1 A and AA on every commit, but an automated audit is not a
conformance claim — it checks the part of the standard a machine can check,
and one rule in it is knowingly not met. What follows is what is built, and
what has been checked.

### Verified by test

- **Roles.** `dialog` and `alertdialog` on the overlays, `menu` and
  `menuitem`, `tablist` / `tab` / `tabpanel`, `switch` on Toggle,
  `progressbar` and `meter` — including that a `meter` never reports an
  `aria-valuenow` outside its range, which the spec forbids and which
  `Gauge` used to do.
- **Keyboard.** Sheet and Alert trap Tab, close on Escape, and move focus
  inward on open — including the case where there is nothing focusable to
  move to, where focus lands on the container rather than being left behind
  the overlay. Menu and ContextMenu close on Escape even when every item is
  disabled.
- **Focus visibility.** Every control draws a `:focus-visible` ring, and a
  test enforces that none of them re-introduces the inline `outline: none`
  that used to override it — a keyboard user could not see what was focused
  until that was fixed.
- **Touch targets.** Button, TextField, SecureField, DatePicker and Picker
  guarantee a 44px minimum height (Buttons 44px wide too), asserted per
  control. It is a default, so a `frame` can still ask for smaller. This is
  the 44×44 that Apple's HIG and WCAG 2.5.5 both call for; axe's own
  `target-size` rule is WCAG 2.2, outside the tags the audit runs, so this is
  checked directly rather than through axe.
- **Writing direction.** A source scan over every `.vue` and `.css` file
  fails the build on a new `margin-left`, `padding-right`, `text-align:
  left` and the rest, where the logical property belongs — the one
  exemption is a context menu, which opens at the pointer and so is
  genuinely physical. The three things CSS cannot mirror on its own are
  tested by hand: the edge-swipe back gesture, the swipe-actions row, and
  the Toggle knob's travel.
- **Reduced motion.** Under `prefers-reduced-motion: reduce`,
  `withAnimation` skips the movement and the state change still lands — a
  reduced path that swallowed the mutation would be worse than the
  animation. Seven components additionally drop their CSS transitions in a
  `@media` block, which is not asserted: happy-dom does not evaluate media
  queries.
- **The modifier contract.** Twelve modifiers across thirty component
  configurations, including that `.hidden()` sets `display: none` and so
  removes a component from the accessibility tree rather than only from
  view.
- **An automated audit, against WCAG 2.1 A and AA.** axe-core over every
  component in the library and every screen of Kitchen, in the unit suite
  (`tests/a11y/axe.test.ts`) and again in a real browser
  (`e2e/a11y.spec.ts`). Four of the rules it applies are re-broken on
  purpose in that file, so a gate that stopped catching anything fails
  rather than going quiet.

  Read it for what it is: axe finds something like a third of what a human
  audit finds. It sees a missing name, a forbidden ARIA attribute, a role
  that swallows its children. It cannot tell you whether an announcement
  makes sense. Six defects were sitting behind it when it was first run,
  three of them controls that could not be given a name at all.

### Built, not verified

- `aria-label`, `aria-expanded`, `aria-controls`, `aria-selected`,
  `aria-checked`, `aria-disabled` and `aria-live` are set throughout, and
  decorative glyphs carry `aria-hidden`. Individual attributes are asserted
  where a bug was found; there is no sweep asserting all of them.

### Contrast: measured, and knowingly short of AA

The theme is Apple's iOS system palette, and a good deal of it does not
reach AA for normal-sized text. That is Apple's tradeoff, and reproducing
it is the point of the library — so the numbers are published rather than
the palette quietly corrected. `tests/utils/contrast.test.ts` pins every
one of them and fails if any gets worse; axe's `color-contrast` rule is the
single rule in the standard switched off, for this reason and no other.

| Pair (on the page background) | Light | Dark | AA normal (4.5) |
| --- | --- | --- | --- |
| `label` — body text | 21 | 21 | pass |
| `secondary-label` | 3.44 | 6.36 | light: large text only |
| `tertiary-label` | 1.74 | 2.27 | decorative only |
| `primary` (systemBlue) | 4.02 | 5.76 | light: fails |
| `red` | 3.55 | — | large text only |
| `green` | 2.22 | — | decorative only |
| white on `primary` | 4.02 | — | fails |

The last row is the one to plan around: a filled blue button with white
text — the most common thing anyone will build with this library — does not
reach AA in the light theme. If you need AA, override `--swift-primary` and
the label greys in your own stylesheet; nothing in the library depends on
their exact values.

### Not covered at all

Be direct about these — they are the things an accessibility audit would
look at first.

- **No screen reader has been used.** Not VoiceOver, not NVDA, not TalkBack.
  Correct ARIA is not the same as a good announcement, and only one of those
  has been checked. This is now the largest gap by some distance.

If you need a conformance statement for a procurement process, this
document is the honest answer: not yet, and here is exactly what is
missing — a screen reader pass, and a contrast decision that is a product
choice rather than an oversight.

## Reporting a gap

A bug report that names the browser and version, and says what you expected,
is worth more than a general one — most of the interesting failures here
have been engine-specific. Issues:
<https://github.com/insub4067/SwiftVue/issues>.
