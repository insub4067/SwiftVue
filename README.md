# SwiftVue

**SwiftUI-style component library for Vue.js** — iOS 개발자가 익숙한 SwiftUI 문법으로 웹앱을 빠르게 개발할 수 있습니다.

**[Live Demo](https://insub4067.github.io/SwiftVue/)**

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

### Data
- `ForEach` — list rendering (`items`, `keyPath`, scoped slot)
- `List` — styled list (`items`, `listStyle`, `keyPath`)
- `Section` — grouped card with `header`/`footer`; `collapsible` folds like DisclosureGroup (`defaultExpanded`)
- `Form` — real `<form>` grouping Sections, `@submit`

### Navigation
- `NavigationStack` — push/pop stack with back button and edge-swipe back (`title`, `displayMode`)
- `NavigationLink` — pushes its `#destination` slot; or `to` (router) / `@tap`
- `TabView` — tab bar (`tabs`, `v-model`)
- `Sheet` — bottom sheet (`v-model:isPresented`, `detents`)

### Feedback
- `Alert` — alert dialog (`v-model:isPresented`, `title`, `message`, `actions`)
- `ProgressView` — loading indicator (`value`, `total`, `progressViewStyle`)

### Media
- `Image` — image (`src`, `alt`, `resizable`, `contentMode`)
- `AsyncImage` — remote image with `#placeholder` / `#error` slots (`url`)

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

`NavigationStack` keeps its stack in memory by default. Add `path` to mirror
it into browser history, so Back, refresh and a shared URL behave the way a
web user expects:

```vue
<NavigationStack title="Settings" path>…</NavigationStack>
```

History carries the stack depth only — pushed views are closures the app
owns, so a reload lands back at the root rather than resurrecting views
nothing re-created. Leave it off when a page holds more than one stack;
only one of them can own history.

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
| `@Environment` | `useEnvironment(key)` | `const config = useEnvironment(ConfigKey)` |
| `@FocusState` | `useFocusState()` | `const focused = useFocusState<Field>()` |
| `.preferredColorScheme()` | `usePreferredColorScheme()` | `scheme.value = 'dark'` |

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

## License

MIT
