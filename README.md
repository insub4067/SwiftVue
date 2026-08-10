# SwiftVue

**SwiftUI-style component library for Vue.js** — iOS 개발자가 익숙한 SwiftUI 문법으로 웹앱을 빠르게 개발할 수 있습니다.

**[Live Demo](https://insub4067.github.io/SwiftVue/)** — every component, one
page each.

**[Kitchen](https://insub4067.github.io/SwiftVue/kitchen/)** — a small real
app (todos and settings) built entirely out of SwiftVue. It is what the
library is regression tested against; see [kitchen/README.md](kitchen/README.md).

## Quick Start

```bash
npm install swiftvue
```

```ts
// main.ts
import { createApp } from 'vue'
import { SwiftVuePlugin } from 'swiftvue'
import 'swiftvue/styles'
import App from './App.vue'

createApp(App).use(SwiftVuePlugin).mount('#app')
```

Components register under their SwiftUI names (`<Text>`, `<Button>`, `<List>` …).
If those collide with another library in your project, prefix them all:

```ts
createApp(App).use(SwiftVuePlugin, { prefix: 'SV' })
```

```vue
<SVVStack :spacing="16">
  <SVText font="title">Hello</SVText>
  <SVTextField v-model="name" />
</SVVStack>
```

Named imports (`import { TextField } from 'swiftvue'`) are unaffected either way.

## SwiftUI vs SwiftVue

| SwiftUI | SwiftVue |
|---------|----------|
| `VStack { }` | `<VStack>` |
| `HStack { }` | `<HStack>` |
| `ZStack { }` | `<ZStack>` |
| `Text("Hello").font(.title)` | `<Text font="title">Hello</Text>` |
| `Button("Tap") { action() }` | `<Button @tap="action">Tap</Button>` |
| `TextField("Name", text: $name)` | `<TextField v-model="name" placeholder="Name" />` |
| `Toggle(isOn: $flag)` | `<Toggle v-model="flag" />` |
| `@State var count = 0` | `const count = useState(0)` |
| `@Binding var value` | `const value = useBinding(get, set)` |
| `@AppStorage("key")` | `const val = useAppStorage("key", default)` |

## Example

```vue
<script setup>
import { VStack, HStack, Text, Button, TextField, Toggle, Spacer, useState } from 'swiftvue'

const name = useState('')
const darkMode = useState(false)
</script>

<template>
  <VStack :spacing="16" :padding="20">
    <Text font="largeTitle">Welcome</Text>
    <Text font="subheadline" foreground-color="secondary">SwiftUI 문법으로 웹 개발하기</Text>

    <TextField v-model="name" placeholder="Enter your name" text-field-style="roundedBorder" />

    <HStack>
      <Text>Dark Mode</Text>
      <Spacer />
      <Toggle v-model="darkMode" />
    </HStack>

    <HStack :spacing="12">
      <Button button-style="borderedProminent" @tap="alert('Hello!')">Primary</Button>
      <Button button-style="bordered" @tap="console.log('tap')">Secondary</Button>
    </HStack>
  </VStack>
</template>
```

## Components

### Layout
- `VStack` — vertical flex container (`spacing`, `alignment`)
- `HStack` — horizontal flex container (`spacing`, `alignment`, `wrap`)
- `ZStack` — layered container (`alignment`)
- `Spacer` — flexible space (`minLength`)
- `Divider` — horizontal line (`color`, `thickness`)
- `ScrollView` — scrollable area (`axes`, `showsIndicators`, `refreshable`)
- `LazyVGrid` — grid flowing down (`columns`, `spacing`, `alignment`)
- `LazyHGrid` — grid flowing sideways (`rows`, `spacing`, `alignment`)

### Text & Input
- `Text` — text display (`font`, `bold`, `italic`, `lineLimit`, `foregroundColor`)
- `Label` — icon + text (`systemImage`, `iconColor`); `for` makes it a real form `<label>`
- `TextField` — text input (`v-model`, `placeholder`, `textFieldStyle`, `v-model:focused`)
- `SecureField` — password input (`v-model`, `placeholder`, `v-model:focused`)
- `TextEditor` — multi-line text (`v-model`, `placeholder`, `v-model:focused`)

### Controls
- `Button` — button (`@tap`, `buttonStyle`, `role`, `fullWidth`, `type`)
- `Toggle` — switch (`v-model`, `tint`)
- `Slider` — range input (`v-model`, `min`, `max`, `step`)
- `Picker` — select/segmented (`v-model`, `options`, `pickerStyle`)
- `Stepper` — increment/decrement (`v-model`, `min`, `max`, `step`)
- `DatePicker` — date/time input (`v-model`, `displayedComponents`, `min`, `max`)
- `Menu` — dropdown of actions (`label`, `actions`, `@select`)
- `ContextMenu` — long press / right click / Shift+F10 menu over any content (`actions`, `@select`)

### Data
- `ForEach` — list rendering (`items`, `keyPath`, scoped slot)
- `List` — styled list (`items`, `listStyle`, `keyPath`)
- `Section` — grouped card with `header`/`footer`; `collapsible` folds like DisclosureGroup (`defaultExpanded`)
- `Form` — real `<form>` grouping Sections, `@submit`
- `SwipeActions` — iOS swipe-to-reveal row (`leading`, `trailing`, `allowsFullSwipe`, `@select`)

### Navigation
- `NavigationStack` — push/pop stack with back button and edge-swipe back (`title`, `displayMode`, `browserBack`, `historyKey`)
- `NavigationLink` — pushes its `#destination` slot; `route`/`param` name it for the URL; or `to` (router) / `@tap`
- `NavigationSplitView` — iPad sidebar beside a detail, an overlay when narrow (`columnVisibility`, `sidebarWidth`, `compactWidth`)
- `TabView` — tab bar (`tabs`, `v-model`); a tab's `badge` draws the iOS pill
- `Sheet` — bottom sheet (`v-model:isPresented`, `detents`)
- `FullScreenCover` — a cover that replaces the screen, not a taller sheet (`v-model:isPresented`, `label`)

### Feedback
- `Alert` — alert dialog (`v-model:isPresented`, `title`, `message`, `actions`)
- `ProgressView` — loading indicator (`value`, `total`, `progressViewStyle`)
- `Gauge` — value in a range (`value`, `min`, `max`, `gaugeStyle`, `tint`, `currentValueLabel`)

### Media
- `Image` — image (`src`, `alt`, `resizable`, `contentMode`)
- `AsyncImage` — remote image with `#placeholder` / `#error` slots (`url`)

## Right to left

`leading` and `trailing` follow the writing direction, as they do in SwiftUI.
Set `dir="rtl"` on a container and the layout mirrors: text aligns to the
right, chevrons point the other way, a `Toggle`'s knob travels the other way,
`SwipeActions` opens its trailing actions from the left, and the back
gesture starts at the right edge.

Nothing in the library hard-codes `left` or `right` where a logical property
would do — a test enforces it, since the mistake is invisible until someone
opens the app in Arabic.

## How modifiers compose

A modifier wraps the view, as it does in SwiftUI, so what you ask for beats
what the component would have picked:

```vue
<TextField v-model="name" foreground-color="red" background="green" :corner-radius="20" />
<Button font="largeTitle" :frame="{ width: 200 }">Tap</Button>
```

Three layers decide the final style, in this order:

| layer | |
|---|---|
| the component's **defaults** | what it looks like when you said nothing — colours, fonts, radii, sizes |
| your **modifiers** | beat any default |
| the component's **essentials** | what it needs to still be itself: a VStack stays a column, a ScrollView keeps scrolling |

`hidden` outranks even essentials — nothing may un-hide a hidden view. And a
component's own dedicated prop is more specific than a general modifier, so
`<Text bold font-weight="light">` is bold, and a disabled `Toggle` stays
dimmed whatever `opacity` says.

Building your own component on the same rules:

```ts
import { useModifiers, composeStyle } from 'swiftvue'

const modifierStyle = useModifiers(props)
const style = computed(() => composeStyle(
  modifierStyle.value,
  { padding: '12px', backgroundColor: 'var(--swift-fill)' },  // defaults
  { display: 'flex' },                                        // essentials
))
```

## Sections & Pull to Refresh

```vue
<Section header="Profile" footer="Synced across devices.">
  <div class="swift-list-row">…</div>
</Section>

<!-- DisclosureGroup: the header folds the rows; state inside survives -->
<Section header="Advanced" collapsible v-model:expanded="open">…</Section>

<!-- .refreshable — pull down from the top; spinner holds until the promise settles -->
<ScrollView :refreshable="reload">…</ScrollView>
```

## onAppear & onDisappear

```ts
import { onAppear, onDisappear } from 'swiftvue'

onAppear(() => reload())
onDisappear(() => cancelPolling())
```

These follow the view's **visibility**, not its mount:

| | |
|---|---|
| mounted, or unhidden by `v-if` | appears |
| pushed over by a NavigationStack | disappears, though it stays mounted |
| popped back to | appears again — this is where a list refreshes |
| unmounted | disappears, unless it already had |

A covered pane is still alive so popping back restores it exactly as it was
left, which is why "appear" cannot mean "mount" here. For work that must
outlive a push — an upload, a socket — use Vue's `onMounted`/`onUnmounted`:
those follow the component, not what the user can see.

## onSubmit

```ts
import { onSubmit } from 'swiftvue'

onSubmit(() => search(query.value))
```

Runs when the user presses Return in any `TextField` or `SecureField` below
this view, so one handler serves a screen of fields instead of each field
wiring `@submit` itself. Nested handlers all run, innermost first — the order
SwiftUI uses.

A `<Form>` keeps its own `@submit` for the form's own submission. The two are
different events and neither stands in for the other.

## Swipe

`useSwipe` is the gesture itself, on any element:

```ts
const row = ref<HTMLElement | null>(null)

useSwipe(row, {
  onSwipeLeft: ({ distance, velocity }) => reveal(),
  onMove: ({ x }) => (offset.value = x),   // follow the finger
  edge: 'left',                             // only start near an edge
})
```

Pointer events, so finger, trackpad and stylus take one path. A drag that
wanders off its axis is treated as a scroll and left alone, rather than
fighting the scroller it belongs to.

`SwipeActions` is SwiftUI's `.swipeActions` built on it — the iOS row that
swipes open:

```vue
<SwipeActions
  :trailing="[
    { label: 'Delete', id: 'del', role: 'destructive' },
    { label: 'Flag', id: 'flag', tint: 'orange' },
  ]"
  :leading="[{ label: 'Pin', id: 'pin' }]"
  @select="onAction"
>
  <HStack :padding="[12, 16]"><Text>Inbox row</Text></HStack>
</SwipeActions>
```

A swipe past most of the row runs the first action outright — SwiftUI's
`allowsFullSwipe`, on by default, and skipped when the row has no measured
width so a stray drag cannot delete something. Because a swipe is reachable
by neither keyboard nor screen reader, the same actions are also rendered as
real buttons, visually hidden until focused.

## onChange & Combine

`.onChange(of:)` translates directly:

```ts
import { onChange } from 'swiftvue'

onChange(volume, (value, oldValue) => save(value))
onChange(() => props.user, reload, { initial: true })  // onChange(of:initial:)
```

For Combine, SwiftVue ships the slice UI code actually uses — a publisher
over Vue reactivity with `map` · `filter` · `removeDuplicates` · `debounce` ·
`throttle` · `sink`. Nothing runs until `sink`, and subscriptions started in
`setup` stop with the component:

```ts
import { publisher } from 'swiftvue'

const stop = publisher(searchText)
  .map(s => s.trim())
  .removeDuplicates()
  .debounce(300)
  .sink(query => search(query))
```

It is deliberately not a full FRP runtime — `computed` already covers
`CombineLatest`-style derivation in Vue.

## Navigation

`NavigationLink` with a `#destination` slot pushes it onto the enclosing
`NavigationStack` — SwiftUI's `NavigationLink(destination:)`:

```vue
<NavigationStack title="Settings">
  <List>
    <NavigationLink destination-title="General">
      <Label system-image="⚙️">General</Label>
      <template #destination>
        <GeneralSettings />
      </template>
    </NavigationLink>
  </List>
</NavigationStack>
```

The stack renders a back button naming the previous view, animates
push/pop like iOS, and pops on an edge swipe. For programmatic control:

```ts
import { useNavigation } from 'swiftvue'

const nav = useNavigation()
nav?.push({ title: 'Detail', content: () => h(DetailView) })
nav?.pop()
nav?.popToRoot()
```

`NavigationLink` with a `to` prop still renders a `router-link` for
vue-router projects.

## iPad: a sidebar beside the detail

SwiftUI's `NavigationSplitView`. Wide enough and the sidebar is a column;
narrower and the same menu becomes an overlay with a scrim, a toggle,
Escape and a focus trap — the switch iPadOS makes at its own portrait
width, which is where `compactWidth` sits by default.

```vue
<NavigationSplitView v-model:column-visibility="visibility" :sidebar-width="260" label="Filters">
  <template #sidebar>
    <List list-style="sidebar">…</List>
  </template>
  <template #detail>
    <NavigationStack title="Inbox">…</NavigationStack>
  </template>
</NavigationSplitView>
```

`columnVisibility` is `automatic` unless you say otherwise, which means
"open when there is room, shut when there is not". It is resolved inside
the component and never written back to your model: rotating an iPad is not
the app changing its mind, and a rotation that mutated your state would be
indistinguishable from one that did.

Two columns rather than SwiftUI's three, so `doubleColumn` and `detailOnly`
are the only explicit values — `all` would name a column that does not
exist here.

The library draws the toggle only when the sidebar cannot be reached any
other way. Set `hides-toggle` when your own toolbar has one.

## Sheet or cover

`Sheet` is `.sheet`: a card over a page you can still see, dismissed by
reaching past it or dragging it down. `FullScreenCover` is
`.fullScreenCover`: it replaces the screen.

```vue
<FullScreenCover v-model:is-presented="composing" label="New message">
  <VStack :padding="16">
    <Button @tap="composing = false">Done</Button>
  </VStack>
</FullScreenCover>
```

There is no backdrop to click, because nothing is left showing to dim, and
no drag to dismiss — on iOS a cover is left deliberately, which is why
SwiftUI makes you provide the way out. **Give it a visible close button.**

One deliberate difference from iOS: **Escape closes it.** A modal that takes
the keyboard and offers no way back is a keyboard trap, and that is not
something the web gets to call a design decision. Escape is the floor, not
the affordance.

## Images

```vue
<!-- .resizable().aspectRatio(contentMode:) -->
<Image src="/photo.jpg" alt="Sunset" resizable content-mode="fill"
  :frame="{ width: 120, height: 120 }" clip-shape="circle" />

<!-- AsyncImage(url:) — its phases are slots -->
<AsyncImage url="/remote.jpg" alt="Remote">
  <template #placeholder>Loading…</template>
  <template #error>Could not load</template>
</AsyncImage>
```

Without `alt` an image is treated as decorative and hidden from assistive
technology, rather than announced as an unlabeled graphic.

## Forms

```vue
<Form @submit="save">
  <Section header="Details">
    <TextField v-model="name" placeholder="Name" />
    <DatePicker v-model="due" displayed-components="date" />
  </Section>
  <Button type="submit" button-style="borderedProminent">Save</Button>
</Form>

<Menu label="More" :actions="[
  { label: 'Rename', id: 'rename' },
  { label: 'Delete', id: 'del', role: 'destructive' },
]" @select="onSelect" />
```

`Form` renders a real `<form>`, so Enter submits and browser validation
works. Every button in the library defaults to `type="button"`, so only an
explicit `type="submit"` triggers it. `Menu` supports arrow-key navigation,
Escape, and dismissal on an outside press.

## Browser history

`NavigationStack` keeps its stack in memory by default. Add `browser-back` to
hand Back and Forward control of it, so the system back gesture and the
hardware back button pop a screen instead of leaving the app:

```vue
<NavigationStack title="Settings" browser-back>…</NavigationStack>
```

On its own it moves the stack but says nothing about where you are:

| | with `browser-back` alone | plus a `history-key` and named screens |
|---|---|---|
| Back / back gesture | pops, restoring the previous screen as it was left | same |
| Forward | returns to the screen, **rebuilt** — its local state is gone | same |
| The URL | never changes | names the screens you are on |
| Reload, or opening a shared link | starts at the root | reopens those screens |

The reason is that a closure has no name, and history can only carry names.
Give your screens names and all four rows turn green — see below.

`browser-back` can be turned on and off while the stack is alive — a tab
that becomes the page's main content takes the seat and hands it back when it
stops being. `history-key` cannot: entries already in browser history carry
the old name, so renaming would leave them unreachable. Changing it warns in
development.

**One stack per page answers the back button.** Browser history is a single
linear list: `history.back()` undoes the most recent entry no matter who
pushed it, and nothing can reach into the middle to remove one — so two
stacks sharing it would pop each other. The first mounted stack claims the
seat; a second one warns in development and stays in memory, which is what a
sidebar or a modal stack wants anyway.

A tabbed app is fine: `TabView` renders one tab at a time, so only that tab's
stack is mounted and it takes the seat. One caveat that follows from the
same single-list constraint — push inside a tab, switch tabs, and the entry
you left behind is still in browser history with nothing listening to it, so
the first Back press after the switch does nothing.

## Deep links

Name the stack with `history-key` and its screens with `route`, and the URL
starts describing where you are:

```vue
<NavigationStack title="Settings" browser-back history-key="settings">
  <NavigationLink route="general" destination-title="General">
    <Label system-image="⚙️">General</Label>
    <template #destination><GeneralView /></template>
  </NavigationLink>

  <!-- rows that share a route tell themselves apart by param -->
  <ForEach :items="users" key-path="id">
    <template #default="{ item }">
      <NavigationLink route="user" :param="item.id" :destination-title="item.name">
        <Text>{{ item.name }}</Text>
        <template #destination><UserView :id="item.id" /></template>
      </NavigationLink>
    </template>
  </ForEach>
</NavigationStack>
```

`?settings=general` and `?settings=user~42` now reopen those screens on a
cold load. Nested screens come back too: each one that opens mounts the links
that name the next, so `?settings=general/sound` restores both in order.

Programmatic navigation gets the same treatment:

```ts
const nav = useNavigation()
nav?.pushRoute('user', '42')             // named — lands in the URL
nav?.push({ content: () => h(AdHoc) })   // unnamed — does not

// register a screen no NavigationLink declares
const stop = nav!.registerRoute('user', (id) => ({
  title: `User ${id}`,
  content: () => h(UserView, { id }),
}))
```

Two things worth knowing:

- **Reopening replaces, it never pushes.** Landing on a shared link puts you
  where the link points, so Back leaves — it does not walk you forward
  through screens you never opened.
- **An unnamed screen ends the link.** Push a closure and the URL keeps
  describing the last named screen above it, rather than inventing a name or
  claiming you are somewhere you are not.

## Motion

`withAnimation` mirrors SwiftUI: run a state change, and every visual
difference it causes animates (via the View Transitions API; where
unsupported, the change simply applies unanimated):

```ts
import { withAnimation, Animations } from 'swiftvue'

withAnimation(() => { expanded.value = !expanded.value })
withAnimation(() => items.value.sort(), Animations.spring)
// presets: default · linear · easeIn/Out/InOut · spring · smooth · snappy · bouncy
```

`TransitionView` is `.transition(_:)` for a conditional view:

```vue
<TransitionView transition="scale">
  <Text v-if="show">Hello</Text>
</TransitionView>

<!-- .asymmetric(insertion:removal:) -->
<TransitionView insertion="moveBottom" removal="opacity">
  <Banner v-if="visible" />
</TransitionView>
```

Presets: `opacity` · `scale` · `slide` (in from leading, out toward trailing) ·
`moveTop` · `moveBottom` · `moveLeading` · `moveTrailing`. Both APIs respect
`prefers-reduced-motion`.

## Grids

`columns`/`rows` take either a track count or a `GridItem[]`:

```vue
<!-- three equal columns -->
<LazyVGrid :columns="3" :spacing="12">…</LazyVGrid>

<!-- as many ≥100px columns as fit -->
<LazyVGrid :columns="[{ adaptive: { minimum: 100 } }]">…</LazyVGrid>

<!-- a fixed sidebar next to a flexible column -->
<LazyVGrid :columns="[{ fixed: 80 }, { flexible: { maximum: 400 } }]">…</LazyVGrid>

<!-- two rows, scrolling sideways -->
<ScrollView axes="horizontal">
  <LazyHGrid :rows="2" :spacing="8">…</LazyHGrid>
</ScrollView>
```

| `GridItem` | SwiftUI | Result |
|---|---|---|
| `{ fixed: 80 }` | `.fixed(80)` | an 80px track |
| `{ flexible: {} }` | `.flexible()` | fills the leftover space |
| `{ flexible: { minimum: 50, maximum: 200 } }` | `.flexible(minimum:maximum:)` | fills, clamped |
| `{ adaptive: 100 }` | `.adaptive(minimum: 100)` | as many ≥100px tracks as fit |

CSS permits one auto-repeat per axis, so keep `adaptive` the only item in the list.

## Modifiers (as props)

All components accept SwiftUI-style modifier props:

```vue
<Text
  :padding="16"
  background="secondaryBackground"
  foreground-color="primary"
  font="headline"
  font-weight="bold"
  :corner-radius="8"
  :shadow="{ radius: 4 }"
  :opacity="0.9"
  :frame="{ maxWidth: '400px' }"
  clip-shape="capsule"
>
  Styled Text
</Text>
```

## Composables

| SwiftUI | SwiftVue | Usage |
|---------|----------|-------|
| `@State` | `useState(initial)` | `const count = useState(0)` |
| `@Binding` | `useBinding(get, set)` | `const val = useBinding(() => x, v => x = v)` |
| `@AppStorage` | `useAppStorage(key, default)` | `const theme = useAppStorage('theme', 'light')` |
| — | `removeAppStorage(key)` | `removeAppStorage('session')` — deletes the key |
| `@Environment` | `useEnvironment(key)` | `const config = useEnvironment(ConfigKey)` |
| `@FocusState` | `useFocusState()` | `const focused = useFocusState<Field>()` |
| `.preferredColorScheme()` | `usePreferredColorScheme()` | `scheme.value = 'dark'` |

Setting an `useAppStorage` ref back to its default is not the same as
deleting the key: the key stays in storage holding an empty value, so
anything reading "is this key absent" — a session token, a consent flag —
still finds something. `removeAppStorage(key)` is the delete, here and in
every other tab; the refs bound to it fall back to their own defaults.

## Focus

`useFocusState` mirrors `@FocusState`, and `v-model:focused` stands in for
`.focused(_:)`. Writing to the state moves focus; the user moving focus writes
back.

```vue
<script setup>
import { useFocusState } from 'swiftvue'
const focused = useFocusState()   // one field
</script>

<template>
  <TextField v-model="name" v-model:focused="focused" />
  <Button @tap="focused = true">Edit</Button>
</template>
```

Add `focus-value` to track which of several fields holds focus — the analogue
of `.focused($field, equals:)`:

```vue
<script setup>
const field = useFocusState<'id' | 'password'>()
</script>

<template>
  <TextField v-model:focused="field" focus-value="id" @submit="field = 'password'" />
  <SecureField v-model:focused="field" focus-value="password" @submit="field = null" />
</template>
```

Setting the state to `null` (or `false` in the boolean form) dismisses focus.
`TextField`, `SecureField`, and `TextEditor` also expose `focus()` and `blur()`
through a template ref.

## Theme

SwiftVue uses CSS variables matching iOS system colors. They follow the system
appearance by default, and `usePreferredColorScheme` forces one — the analogue
of SwiftUI's `.preferredColorScheme(_:)`:

```ts
import { usePreferredColorScheme } from 'swiftvue'

const scheme = usePreferredColorScheme() // Ref<'light' | 'dark' | null>
scheme.value = 'dark'   // force dark
scheme.value = null     // follow the system again
```

The choice persists across sessions and wins over the OS setting in both
directions. Available tokens:

- `primary`, `secondary`, `accent`
- `red`, `orange`, `yellow`, `green`, `blue`, `purple`, `pink`
- `label`, `secondaryLabel`, `tertiaryLabel`
- `background`, `secondaryBackground`, `tertiaryBackground`
- `separator`, `fill`

## What it runs on

Node 22/24/26, Vue 3.5+, and any browser with CSS logical properties. Which
of those are covered by a test and which are only expected to work is set
out in [docs/SUPPORT.md](docs/SUPPORT.md), along with an honest account of
what has and has not been checked for accessibility.

Changes between versions are in [CHANGELOG.md](CHANGELOG.md). SwiftVue is
pre-1.0: while the major version is 0, a minor bump may change behaviour and
a patch only fixes it.

## License

MIT
