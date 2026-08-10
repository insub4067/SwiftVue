# Changelog

Written for someone deciding whether to upgrade, so each entry says what
changes for them rather than which files moved.

SwiftVue is pre-1.0. While the major version is 0, a **minor** bump may
change behaviour and a **patch** only fixes it. Anything that would break
working code is called out under *Breaking* with the change you need to make.

## Unreleased

An automated accessibility audit, the six defects it found, and a
long-standing `withAnimation` flash.

**Added**

- **`v-animate` — mark a region animatable, the way every SwiftUI view is.**
  SwiftUI animates only the views that read the value you changed, because it
  holds the dependency graph. On the web that knowledge has to be supplied,
  and this is the least intrusive way to supply it: put `v-animate` on the
  regions that may animate, once, and a plain `withAnimation(() => …)` names
  every marked element before it snapshots the page — so the ones whose
  pixels changed move and everything else, marked or not, holds still. No
  scope argument at the call site, and no DOM added: the directive names the
  element it sits on. Mark single-root elements, and do not nest marks.

**Fixed**

- **`withAnimation` flashed the whole screen for a one-element change.** It
  drives the View Transitions API, which — told nothing about what moved —
  snapshots the entire page and cross-fades it, and that page-wide fade is a
  visible flash even when a single card changed. It could not have known
  better: SwiftUI animates only the views that depend on the value because
  it has the dependency graph, and the web does not. So the knowledge is now
  something you supply — `v-animate` on the regions that animate (above), or
  `withAnimation(mutate, animation, { scope: el })` to name the element at
  the call site. With neither, the whole-page transition is unchanged, which
  is still right for a route or theme change. Overlapping calls on the same
  element are reference-counted, so a rapid second animation cannot leave a
  transition name stranded on it; a synchronous failure to start the
  transition still applies the mutation and clears the name it set.

**Fixed (accessibility)**

- **Six controls could not be given an accessible name.** `TextField`,
  `SecureField`, `TextEditor` and `Picker` had no `label` prop at all, so a
  screen reader announced them as their type and nothing else — "edit
  text", "combo box". Each takes `label` now, which is SwiftUI's first
  argument (`TextField("Name", text:)`). `DatePicker` already had one; what
  it lacked was any sign when you forgot it, and a control that ends up
  with no name from any source now says so in development.

  A placeholder still counts as a name and stays quiet. It is a weak one —
  it disappears the moment anything is typed — but it is a name, and
  warning about every one of them would be an opinion rather than a defect
  report.
- **A segmented `Picker` never said which segment was chosen.** The
  selection was a CSS class and nothing more, so the single fact the
  control exists to convey was the one fact assistive technology could not
  reach. It is a `radiogroup` of `radio`s now, with `aria-checked`.
- **`ContextMenu` set an ARIA attribute its element was not allowed to
  carry.** `aria-expanded` on a plain `<div>` is invalid — the generic role
  does not permit it — so it was discarded. It is gone; `aria-haspopup`,
  which *is* valid there, stays and says the element opens a menu. No role
  is claimed on the wrapper on purpose: ContextMenu wraps arbitrary content,
  often a `Button` or `NavigationLink`, and a widget role over an
  interactive element flattens the inner control out of reach — the same
  trap the todo row below hit. Opening stays on the pointer (right-click,
  long press) and the standard keys (ContextMenu, Shift+F10), none of which
  need a role.
- **A checkbox inside a `NavigationLink` was unreachable.** A `role="button"`
  is a leaf to assistive technology and everything inside it collapses into
  its name, so a control nested there cannot be operated at all. This was
  Kitchen's todo row; stopping the click from propagating had hidden it
  from a mouse and left it entirely in place for VoiceOver. The row is
  restructured so the checkbox sits beside the link rather than within it.

**Added**

- **An accessibility gate, against WCAG 2.1 A and AA.** axe-core over every
  component and every Kitchen screen in the unit suite, and again in a real
  browser where the layout-dependent rules work. Four rules are re-broken on
  purpose in the same file, so a gate that stopped catching anything fails
  instead of going quiet.
- **The palette's contrast ratios, measured and pinned.** Apple's iOS
  colours do not reach AA for normal text in several pairs — `systemBlue` on
  white is 4.02:1 against a 4.5:1 bar, so a filled blue button with white
  text fails, exactly as it does in iOS. Reproducing that is the point of
  the library, so the figures are published in `docs/SUPPORT.md` and pinned
  by a test that fails if any of them gets worse, and axe's `color-contrast`
  is the one rule in the standard deliberately switched off.

## 0.4.0

Two components the iPad needed, and the delete that never deleted.

Still beta. The gaps named in `docs/SUPPORT.md` are the same ones — no
real-device gate, no automated accessibility audit, no screen reader has
been used — and a version number does not close them.

**Fixed**

- **A key deleted in another tab came back.** `removeItem` or `clear`
  elsewhere made this tab's refs fall back to their defaults — and that
  mutation woke the watcher, which wrote the default straight back. The key
  returned holding an empty value, so "the key is gone" and "the key is
  empty" stopped being different things. For a token cleared at logout they
  are very much different: anything reading *absence* as the signal still
  found something. A change arriving from storage is no longer written back.

**Added**

- **`FullScreenCover`** — SwiftUI's `.fullScreenCover`, which is not a
  taller `Sheet`. A sheet is a card over a page you can still see and
  dismiss by reaching past it; a cover replaces the screen, so it has no
  backdrop and no drag to dismiss. One deliberate difference from iOS:
  Escape closes it, because a modal that takes the keyboard and offers no
  way back is a keyboard trap. Give it a visible close button anyway.
- **`NavigationSplitView`** — SwiftUI's iPad shape: a sidebar beside the
  thing it chose, rather than a screen pushed over the one before it. Wide
  enough and it is a column; narrower and the same menu becomes an overlay
  with a scrim, a toggle, Escape and a focus trap. `columnVisibility` is a
  v-model (`automatic` follows the width), `sidebarWidth` is
  `.navigationSplitViewColumnWidth()`, and `compactWidth` is where the
  switch happens — 768 by default, the iPad's portrait width.

  Two columns rather than three, so `all` is not offered: a name promising
  a column that does not exist would be a lie. `automatic` is resolved
  internally and never written back to your model, because a rotation is
  not the app changing its mind.
- `removeAppStorage(key)` — the delete half of the contract, which was
  missing. Setting a ref to its default never removed anything; this takes
  the key out of storage, here and in every other tab, and falls every ref
  bound to it back to its own default.

## 0.3.0

Seven defects, found by building an app out of the library rather than by
looking at the library. Three of them are the same gesture: **swipe
actions had never once worked in a browser**, and upgrading is worth it for
that alone.

A minor rather than a patch, because a tab now keeps its screen — see the
note under that entry before upgrading if anything of yours searches the
whole document for an element.

**Fixed**

- **Every swipe was thrown away mid-drag.** The row slides under the
  pointer, so the browser keeps re-deciding what is beneath it and fires a
  `pointerleave` from an element the pointer never left. `useSwipe` took
  that for a cancel, and no swipe on any row ever completed in a real
  browser — the unit tests could not see it because nothing synthetic sends
  that leave. The gesture now captures the pointer, which is what pointer
  capture is for: the whole drag belongs to the element, and the release is
  reported even when the finger lifts elsewhere. Claimed on the first real
  movement rather than on the press — a captured pointer also retargets the
  click a *tap* produces onto the capturing element, which would stop a row
  that links somewhere from opening when tapped.
- **`allowsFullSwipe` did nothing on a phone.** A swipe past 60% of a row is
  supposed to run its first action outright. The 60% was measured against
  how far the *row* had moved, and a row only follows the finger as far as
  its actions plus a little give — 208px with two of them. So on any row
  wider than about 350px the threshold was unreachable and the gesture
  simply parked the row open. It is measured against the gesture now.
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
