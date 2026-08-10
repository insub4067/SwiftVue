# Changelog

Written for someone deciding whether to upgrade, so each entry says what
changes for them rather than which files moved.

SwiftVue is pre-1.0. While the major version is 0, a **minor** bump may
change behaviour and a **patch** only fixes it. Anything that would break
working code is called out under *Breaking* with the change you need to make.

## Unreleased

**Fixed**

- **Swiping a row also opened it.** A drag ends with the browser sending a
  `click`, and the content inside the row cannot tell that from a tap — so
  on a list of `NavigationLink`s, swiping a row open pushed the screen it
  linked to at the same time. Which is the one thing swipe-to-reveal must
  never do: the row you were about to delete opens instead. A drag past 8px
  now swallows that click, and only that one.
- A tab you came back to was rebuilt from scratch. Only the selected tab
  rendered, so glancing at another one put a pushed screen back at its root
  and emptied a half-typed field. A tab is built the first time it is opened
  and kept from then on, the way SwiftUI's `TabView` does it — and a kept
  tab counts as disappeared, so `onAppear` fires on the way back.

  Worth knowing before you upgrade: a tab you have visited is still in the
  DOM after you leave it, hidden with `display: none`. Anything that
  searched the whole document for an element — `querySelector`, an
  unscoped end-to-end selector — can now find one on a tab nobody is
  looking at. Scope those to the visible panel; `[role="tabpanel"]` marks
  each one. This broke three of SwiftVue's own browser tests, which is how
  it came to be written down.
- Every `NavigationLink` warned about a missing `router-link` in a project
  with no vue-router. The tag's lookup ran above the `v-if` guarding it.
- `padding` rejected the three-value CSS shorthand. `[8, 0, 24]` is what a
  screen with a tab bar under it wants, and only two and four were accepted.

**Added**

- `swift-app-fullscreen` — the shell an app that fills the window needs.
  `TabView` and `NavigationStack` are `height: 100%` and `<body>` has no
  height, so without a shell the whole app collapsed to its content height
  and the tab bar landed on top of the list. Every app built on SwiftVue hit
  this and solved it privately; now the library ships it, opt-in, and
  `docs/LAYOUT.md` explains it as rule 0.
- **Kitchen** — a small real app (todos and settings) built out of SwiftVue,
  at `/kitchen/` on the demo site. It is type-checked, linted and mounted in
  the unit suite; everything above is something it found.

## 0.2.1

Four defects, all in code that only misbehaves under conditions the demo
never reaches.

**Fixed**

- A screen pushed at the same depth as a previous one could inherit its
  state — the panes were keyed by array position, so Vue patched one into
  the other instead of remounting. It took a shared render closure (which a
  route registry hands out) and a replacement inside a single render (which
  restoring a deep link does), but then the new screen showed the old
  screen's typed text. Each pane now carries an id of its own.
- `NavigationLink` registered its `route` once, on mount. A row reused
  inside a `ForEach` kept answering to the name it used to have.
- `browserBack` was read once and never again. It is reactive now: a tab
  that becomes the page's main content takes the history seat and hands it
  back when it stops being.
- A key removed or cleared in another tab was ignored, so a logout in one
  tab left every other tab still holding the value. Each `useAppStorage` ref
  falls back to its own default.

**Known limits**

- `historyKey` is read once, when the stack first answers the back button.
  Entries already in history carry the old name, so renaming would leave
  them unreachable. Changing it warns in development.

## 0.2.0

**Breaking**

- `NavigationStack`'s `path` prop is now `browser-back`. It claimed to make
  "Back, refresh and a shared URL behave the way a web user expects" and
  only the first was true. Rename the prop; add `history-key` and `route`
  if you want the rest, which now works.

**Fixed**

- **`.hidden()` had never worked on any component.** Every component wrote
  its own `display` after the modifier's, so `display: none` was overwritten.
- **Modifiers were being dropped by the controls.** `foreground-color`,
  `background`, `corner-radius`, `font`, `frame` and `border` were all
  silently ignored on `TextField`, `Button`, `Picker`, `Toggle` and the
  rest — a component's own style won every disagreement. `font` on a Picker
  was worse than ignored: the line height and weight applied while the size
  did not. See *How modifiers compose* in the README for the rule.
- `leading` and `trailing` were written as `left` and `right`, so every one
  of them was backwards in an Arabic or Hebrew page.
- Two navigation stacks on a page popped each other. One stack per page
  answers the back button now; a second warns in development.
- A malformed deep link (`?nav=%`) threw during mount and took the app down.
- `history-key="settings"` wrote `history.state.settings`, over whatever the
  host router kept there.
- Neither `Alert` nor `Sheet` could be closed from the keyboard when there
  was nothing focusable inside them.
- An `Alert` with no actions threw on Escape.
- A long press on a `ContextMenu` also ran the content underneath, so
  wrapping a `Button` did both.
- `Menu` and `ContextMenu` ignored Escape when no item was enabled.
- `Gauge` reported an out-of-range `aria-valuenow`, which the meter role
  disallows.

**Added**

- `onAppear` / `onDisappear` — visibility, not mount. A screen covered by a
  push has disappeared; popping back to it makes it appear again.
- `onSubmit` — Return in any field below the view, one handler per screen.
- `useSwipe` and `SwipeActions` — the gesture, and the iOS row built on it.
- `ContextMenu`, `Gauge`, and `badge` on a `TabView` tab.
- Deep links: `history-key` on the stack and `route` on a link put named
  screens in the URL, and a cold load reopens them.
- `composeStyle` is exported, for building components on the same rules.

**Infrastructure**

- WebKit joins Chromium in the E2E matrix. Every layout bug that has cost
  this project a day was WebKit-only.
- The modifier contract is a matrix: twelve modifiers across thirty
  components.

## 0.1.0

First release.
