# SwiftVue Kitchen

A small app — todos and the settings that govern them — built entirely out
of SwiftVue.

```
npm run kitchen          # dev server
npm run kitchen:build    # production build
```

## Why it exists

A component gallery proves each component renders. It does not prove they
work together, and every expensive bug in this project has lived in the
seams: a modifier overwritten by a component's own style, a screen keyed by
its position in a list, a link that answered to the name it used to have.

Kitchen is an app rather than a gallery on purpose. Each screen is
something a person would actually use, so the components meet each other
the way they do in a real project:

| | |
|---|---|
| `NavigationStack` · `NavigationLink` | the list pushes a todo; the todo is in the URL and comes back after a reload |
| `TabView` | two tabs, with the open count as a badge |
| `SwipeActions` | delete and flag on a row, by finger or by keyboard |
| `Sheet` · `Form` · `onSubmit` | the new-todo sheet, saved by button or by Return |
| `Alert` | destructive actions, cancelled with Escape |
| `Section` | grouped rows, and a collapsible one for completed todos |
| `Toggle` · `Picker` · `Stepper` · `DatePicker` · `TextField` · `TextEditor` | the settings and the editor |
| `AppStorage` | every setting and every todo, surviving a reload and following another tab |
| `onAppear` / `onDisappear` | the detail screen counts visibility, not mounts |
| `Gauge` · `ProgressView` | how much is done |
| `usePreferredColorScheme` | Appearance, forcing light or dark over the OS |

## What it is for

**Finding bugs.** Kitchen is type-checked and linted alongside the library,
and its screens are mounted in the unit suite — including a test that fails
on any Vue warning. Building the first version turned up six library
defects that a per-component test had no way to see:

- **`allowsFullSwipe` did nothing on a phone.** The 60%-of-the-row threshold
  was measured against how far the row had moved, and the row stops at its
  actions — 208px — so a row wider than about 350px could never reach it.
  The unit test had stubbed the row at 320px, just inside the range where it
  works.
- **Swiping a row also opened it.** A drag ends with a `click`, and the
  `NavigationLink` inside the row took it as a tap — so revealing Delete
  pushed the todo's screen over the button you were reaching for. Only a
  swipe on a row that links somewhere shows this, and only in a browser
  that sends the click.

- `padding` rejected the three-value CSS shorthand, so `[8, 0, 24]` — a
  screen leaving room for the tab bar — would not type-check.
- Every `NavigationLink` warned about a missing `router-link` in a project
  with no vue-router.
- A tab you came back to was rebuilt from scratch, losing its navigation
  depth and anything half-typed.
- **The library had no app shell.** `TabView` and `NavigationStack` are
  `height: 100%` and `<body>` has none, so the app collapsed to its content
  height and the tab bar landed on top of the list. The playground had
  solved this privately a year earlier and nobody had noticed the library
  never shipped it. `swift-app-fullscreen` does now.

The app shell is the argument for Kitchen in one item. Nothing was broken in
any component; the library simply could not be assembled into an app
without a piece it did not provide, and only building an app could show it.

The swipe is the argument for the browser half. Every unit test of
`SwipeActions` passed throughout, because happy-dom never sends the `click`
that follows a drag. It took a real pointer on a real row.

**Checking the things only a browser knows.** `e2e/kitchen.spec.ts` drives
it in Chromium and WebKit: no horizontal overflow at 320–430px, a real
pointer drag on a swipe row, Back and Forward through pushed screens, a
deep link reopened from a cold load, and the right-to-left layout with its
chevrons mirrored.

**Being the thing that has to still work.** Before a release, Kitchen is
what gets exercised by hand.

## How it imports the library

By name — `@swiftvue`, aliased to `../src` — never by a relative path into
the library's internals. The alias points at the working tree rather than
the published package deliberately: Kitchen has to fail on a change that
has not shipped yet, which is the whole point of a regression app. The
published package is verified separately by `scripts/verify-package.mjs`,
which builds its own consumer against the packed tarball.
