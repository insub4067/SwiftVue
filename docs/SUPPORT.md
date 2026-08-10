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

SwiftVue does not claim a WCAG conformance level. Claiming one means having
audited against it, and no audit has been run. What follows is what is
built, and what has been checked.

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
- **Writing direction.** A source scan over every `.vue` and `.css` file
  fails the build on a new `margin-left`, `padding-right`, `text-align:
  left` and the rest, where the logical property belongs — the one
  exemption is a context menu, which opens at the pointer and so is
  genuinely physical. The three things CSS cannot mirror on its own are
  tested by hand: the edge-swipe back gesture, the swipe-actions row, and
  the Toggle knob's travel.
- **Reduced motion.** Under `prefers-reduced-motion: reduce`,
  `withAnimation` skips the view transition and the state change still
  lands — a reduced path that swallowed the mutation would be worse than
  the animation. Seven components additionally drop their CSS transitions
  in a `@media` block, which is not asserted: happy-dom does not evaluate
  media queries.
- **The modifier contract.** Twelve modifiers across thirty component
  configurations, including that `.hidden()` sets `display: none` and so
  removes a component from the accessibility tree rather than only from
  view.

### Built, not verified

- `aria-label`, `aria-expanded`, `aria-controls`, `aria-selected`,
  `aria-checked`, `aria-disabled` and `aria-live` are set throughout, and
  decorative glyphs carry `aria-hidden`. Individual attributes are asserted
  where a bug was found; there is no sweep asserting all of them.

### Not covered at all

Be direct about these — they are the things an accessibility audit would
look at first.

- **No automated audit.** No axe-core, no pa11y, no Lighthouse gate.
- **No screen reader has been used.** Not VoiceOver, not NVDA, not TalkBack.
  Correct ARIA is not the same as a good announcement, and only one of those
  has been checked.
- **No contrast measurement.** The default theme's colour pairs have never
  been run against a contrast ratio.
- **No focus-visible audit.** Focus rings are inherited from the browser in
  most components rather than designed.
- **Touch target sizes** are not measured against the 44×44 guidance.

If you need a conformance statement for a procurement process, this
document is the honest answer: not yet, and here is exactly what is
missing.

## Reporting a gap

A bug report that names the browser and version, and says what you expected,
is worth more than a general one — most of the interesting failures here
have been engine-specific. Issues:
<https://github.com/insub4067/SwiftVue/issues>.
