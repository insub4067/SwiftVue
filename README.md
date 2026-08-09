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
- `HStack` — horizontal flex container (`spacing`, `alignment`)
- `ZStack` — layered container (`alignment`)
- `Spacer` — flexible space (`minLength`)
- `Divider` — horizontal line (`color`, `thickness`)
- `ScrollView` — scrollable area (`axes`, `showsIndicators`)
- `LazyVGrid` — grid flowing down (`columns`, `spacing`, `alignment`)
- `LazyHGrid` — grid flowing sideways (`rows`, `spacing`, `alignment`)

### Text & Input
- `Text` — text display (`font`, `bold`, `italic`, `lineLimit`, `foregroundColor`)
- `Label` — icon + text (`systemImage`, `iconColor`)
- `TextField` — text input (`v-model`, `placeholder`, `textFieldStyle`)
- `SecureField` — password input (`v-model`, `placeholder`)
- `TextEditor` — multi-line text (`v-model`, `placeholder`)

### Controls
- `Button` — button (`@tap`, `buttonStyle`, `role`, `fullWidth`)
- `Toggle` — switch (`v-model`, `tint`)
- `Slider` — range input (`v-model`, `min`, `max`, `step`)
- `Picker` — select/segmented (`v-model`, `options`, `pickerStyle`)
- `Stepper` — increment/decrement (`v-model`, `min`, `max`, `step`)

### Data
- `ForEach` — list rendering (`items`, `keyPath`, scoped slot)
- `List` — styled list (`items`, `listStyle`)

### Navigation
- `NavigationStack` — navigation container (`title`, `displayMode`)
- `NavigationLink` — navigation link (`to`, `@tap`)
- `TabView` — tab bar (`tabs`, `v-model`)
- `Sheet` — bottom sheet (`v-model:isPresented`, `detents`)

### Feedback
- `Alert` — alert dialog (`v-model:isPresented`, `title`, `message`, `actions`)
- `ProgressView` — loading indicator (`value`, `total`, `progressViewStyle`)

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

## Theme

SwiftVue uses CSS variables matching iOS system colors. They automatically adapt to light/dark mode:

- `primary`, `secondary`, `accent`
- `red`, `orange`, `yellow`, `green`, `blue`, `purple`, `pink`
- `label`, `secondaryLabel`, `tertiaryLabel`
- `background`, `secondaryBackground`, `tertiaryBackground`
- `separator`, `fill`

## License

MIT
