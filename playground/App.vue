<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useFocusState } from '../src/composables/useFocusState'
import { usePreferredColorScheme } from '../src/composables/usePreferredColorScheme'
import { withAnimation, Animations } from '../src/motion/withAnimation'
import type { TransitionPreset } from '../src/components/motion/TransitionView.vue'
import { onChange } from '../src/composables/onChange'
import { onSubmit } from '../src/composables/useSubmit'
import { publisher } from '../src/combine/publisher'
import { version } from '../package.json'
import CodeSample from './CodeSample.vue'
import AppearCounter from './AppearCounter.vue'

declare const __BUILD_TIME__: string
const buildTime = __BUILD_TIME__
const staleBuild = ref(false)

// The stacks put their own screens in the URL under `?components=…`; the tab
// has to go there too, or a shared link opens the right screen in a stack
// nobody is looking at.
const TAB_IDS = ['components', 'controls', 'layout', 'styles']
const tabFromUrl = new URLSearchParams(location.search).get('tab')
const activeTab = ref(TAB_IDS.includes(tabFromUrl ?? '') ? tabFromUrl! : 'components')

watch(activeTab, (tab) => {
  const url = new URL(location.href)
  url.searchParams.set('tab', tab)
  history.replaceState(history.state, '', url)
})
const showSheet = ref(false)
const showAlert = ref(false)
const showDeleteAlert = ref(false)

const username = ref('')
const password = ref('')
const bio = ref('')
const searchText = ref('')
const loginId = ref('')
const loginPassword = ref('')
const focusedField = useFocusState<'id' | 'password'>()

const showBox = ref(true)
const boxTransition = ref<TransitionPreset>('scale')
const transitionOptions = [
  { value: 'opacity', label: 'opacity' },
  { value: 'scale', label: 'scale' },
  { value: 'slide', label: 'slide' },
  { value: 'moveBottom', label: 'move' },
]
const expanded = ref(false)
const shuffled = ref([1, 2, 3, 4, 5, 6])
function shuffle() {
  shuffled.value = [...shuffled.value].sort(() => Math.random() - 0.5)
}

const sampleImage = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">
     <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
       <stop offset="0" stop-color="#0A84FF"/><stop offset="1" stop-color="#BF5AF2"/>
     </linearGradient></defs>
     <rect width="320" height="200" fill="url(#g)"/>
     <circle cx="235" cy="55" r="30" fill="#FFD60A"/>
   </svg>`)
const advancedOpen = ref(true)
const dueDate = ref('2026-08-09')
const meetingTime = ref('14:30')
const menuChoice = ref('아직 선택 없음')
const formName = ref('')
const formSubmitted = ref('')
function submitForm() { formSubmitted.value = `제출됨: ${formName.value || '(이름 없음)'} · ${dueDate.value}` }
const menuActions = [
  { label: 'Rename', id: 'rename', systemImage: '✏️' },
  { label: 'Duplicate', id: 'dup', systemImage: '📄' },
  { label: 'Delete', id: 'del', systemImage: '🗑️', role: 'destructive' as const },
]
const refreshLog = ref<string[]>(['처음 항목 — 아래로 당겨서 새로고침'])
async function reload() {
  await new Promise(r => setTimeout(r, 900))
  refreshLog.value = [`Refreshed at ${new Date().toLocaleTimeString()}`, ...refreshLog.value].slice(0, 6)
}

const searchInput = ref('')
const debouncedQuery = ref('')
const volumeLog = ref('아직 변경 없음')
publisher(searchInput)
  .map(s => s.trim())
  .removeDuplicates()
  .debounce(400)
  .sink(q => { debouncedQuery.value = q })

const colorScheme = usePreferredColorScheme()
const darkMode = computed({
  get: () => colorScheme.value === 'dark',
  set: (v) => { colorScheme.value = v ? 'dark' : 'light' },
})
const volume = ref(50)
onChange(volume, (value, oldValue) => {
  volumeLog.value = `volume: ${oldValue} → ${value}`
})
const brightness = ref(75)
const count = ref(3)
const fontSize = ref(17)
const rating = ref(0)
const selectedFruit = ref('apple')
const selectedSize = ref('medium')
const notifications = ref(true)
const wifiEnabled = ref(true)
const bluetoothEnabled = ref(false)
const progress = ref(0)
const downloadProgress = ref(65)

const fruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'grape', label: 'Grape' },
]

const sizes = [
  { value: 'small', label: 'S' },
  { value: 'medium', label: 'M' },
  { value: 'large', label: 'L' },
  { value: 'xlarge', label: 'XL' },
]

const todos = ref([
  { id: 1, title: 'Build SwiftVue components', done: true },
  { id: 2, title: 'Add accessibility support', done: true },
  { id: 3, title: 'Write unit tests', done: true },
  { id: 4, title: 'Set up CI/CD pipeline', done: true },
  { id: 5, title: 'Publish to npm', done: false },
  { id: 6, title: 'Write documentation', done: false },
])

const colors = [
  { name: 'Red', var: 'var(--swift-red)' },
  { name: 'Orange', var: 'var(--swift-orange)' },
  { name: 'Yellow', var: 'var(--swift-yellow)' },
  { name: 'Green', var: 'var(--swift-green)' },
  { name: 'Mint', var: 'var(--swift-mint)' },
  { name: 'Teal', var: 'var(--swift-teal)' },
  { name: 'Cyan', var: 'var(--swift-cyan)' },
  { name: 'Blue', var: 'var(--swift-blue)' },
  { name: 'Indigo', var: 'var(--swift-indigo)' },
  { name: 'Purple', var: 'var(--swift-purple)' },
  { name: 'Pink', var: 'var(--swift-pink)' },
  { name: 'Brown', var: 'var(--swift-brown)' },
]

const unread = ref(3)
const tabs = computed(() => [
  { id: 'components', label: 'Components', icon: '🧩', badge: unread.value },
  { id: 'controls', label: 'Controls', icon: '🎛️' },
  { id: 'layout', label: 'Layout', icon: '📐' },
  { id: 'styles', label: 'Styles', icon: '🎨' },
])

const signal = ref(0.68)
const battery = ref(42)

const contextActions = [
  { label: 'Copy', id: 'copy', systemImage: '📋' },
  { label: 'Duplicate', id: 'dup', systemImage: '📄' },
  { label: 'Archive', id: 'archive', systemImage: '📦', disabled: true },
  { label: 'Delete', id: 'del', systemImage: '🗑', role: 'destructive' as const },
]
const contextChoice = ref('아직 선택 없음')

const inbox = ref([
  { id: 1, from: 'Apple', subject: 'Your receipt' },
  { id: 2, from: 'GitHub', subject: 'PR review requested' },
  { id: 3, from: 'npm', subject: 'swiftvue published' },
])
const swipeLog = ref('행을 왼쪽으로 밀어보세요')
function onSwipeAction(action: { label: string }, id: number) {
  swipeLog.value = `${action.label} · #${id}`
  if (action.label === 'Delete') inbox.value = inbox.value.filter(m => m.id !== id)
}

const submitQuery = ref('')
const submitted = ref('아직 제출 없음')
onSubmit(() => { submitted.value = submitQuery.value || '(빈 값)' })

function toggleTodo(index: number) {
  todos.value[index].done = !todos.value[index].done
}

function handleAlertAction(label: string) {
  if (label === 'Delete') {
    // destructive action demo
  }
}

let progressTimer: ReturnType<typeof setInterval> | null = null
function simulateProgress() {
  progress.value = 0
  if (progressTimer) clearInterval(progressTimer)
  progressTimer = setInterval(() => {
    progress.value += 2
    if (progress.value >= 100) {
      if (progressTimer) clearInterval(progressTimer)
    }
  }, 50)
}

const completedCount = computed(() => todos.value.filter(t => t.done).length)
const completionPercent = computed(() => Math.round((completedCount.value / todos.value.length) * 100))

const samples: Record<string, { code: string; sources: string[] }> = {
  media: {
    code: `<!-- .resizable().aspectRatio(contentMode:) -->
<Image src="/photo.jpg" alt="Sunset" resizable content-mode="fill"
  :frame="{ width: 120, height: 120 }" :corner-radius="12" />

<!-- AsyncImage(url:) with its loading phases -->
<AsyncImage url="/remote.jpg" alt="Remote" :frame="{ height: 140 }">
  <template #placeholder>Loading…</template>
  <template #error>Could not load</template>
</AsyncImage>`,
    sources: ['src/components/media/SVImage.vue', 'src/components/media/AsyncImage.vue'],
  },
  form: {
    code: `<Form @submit="save">
  <Section header="Details">
    <TextField v-model="name" label="Name" />
    <DatePicker v-model="due" label="Due" displayed-components="date" />
  </Section>
  <!-- every other button defaults to type="button" -->
  <Button type="submit" button-style="borderedProminent">Save</Button>
</Form>`,
    sources: ['src/components/data/Form.vue', 'src/components/controls/DatePicker.vue'],
  },
  menu: {
    code: `<Menu label="More" :actions="[
  { label: 'Rename', id: 'rename', systemImage: '✏️' },
  { label: 'Delete', id: 'del', role: 'destructive' },
]" @select="onSelect" />`,
    sources: ['src/components/controls/Menu.vue'],
  },
  contextMenu: {
    code: `<!-- long press on touch, right click on desktop,
     Shift+F10 from the keyboard -->
<ContextMenu label="Photo actions" :actions="[
  { label: 'Copy', id: 'copy', systemImage: '📋' },
  { label: 'Archive', id: 'archive', disabled: true },
  { label: 'Delete', id: 'del', role: 'destructive' },
]" @select="onSelect">
  <VStack>…</VStack>
</ContextMenu>`,
    sources: ['src/components/controls/ContextMenu.vue'],
  },
  gauge: {
    code: `<!-- circular is SwiftUI's accessoryCircular dial -->
<Gauge :value="signal" label="Signal" current-value-label="68%" />
<Gauge :value="battery" :min="0" :max="100" label="Battery"
       tint="green" :size="72" />

<!-- linear is the capacity bar, with optional end captions -->
<Gauge gauge-style="linear" :value="battery" :min="0" :max="100"
       label="Battery" current-value-label="42%"
       minimum-value-label="0" maximum-value-label="100" />`,
    sources: ['src/components/feedback/Gauge.vue'],
  },
  badge: {
    code: `<!-- SwiftUI's .badge() — 0 and '' draw nothing -->
const tabs = computed(() => [
  { id: 'inbox', label: 'Inbox', icon: '📥', badge: unread.value },
  { id: 'sent', label: 'Sent', icon: '📤' },
])

<TabView :tabs="tabs" v-model="activeTab">…</TabView>

<!-- over 99 shows 99+, but assistive tech still hears the count -->`,
    sources: ['src/components/navigation/TabView.vue'],
  },
  lifecycle: {
    code: `import { onAppear, onDisappear } from 'swiftvue'

// visibility, not mount: a pane covered by a push has
// disappeared even though it is still alive
onAppear(() => reload())
onDisappear(() => cancelPolling())`,
    sources: ['src/composables/useLifecycle.ts'],
  },
  submitSwipe: {
    code: `// one handler for every field on the screen
onSubmit(() => search(query.value))

<TextField v-model="query" placeholder="Search" />

<!-- .swipeActions — full swipe runs the first action -->
<SwipeActions
  :trailing="[
    { label: 'Delete', id: 'del', role: 'destructive' },
    { label: 'Flag', id: 'flag', tint: 'orange' },
  ]"
  @select="onAction"
>
  <HStack :padding="[12, 16]">…</HStack>
</SwipeActions>`,
    sources: [
      'src/composables/useSubmit.ts',
      'src/composables/useSwipe.ts',
      'src/components/data/SwipeActions.vue',
    ],
  },
  navPath: {
    code: `<!-- browser-back: Back and Forward drive the stack, so the
     system back gesture pops instead of leaving the app.
     history-key + route: named screens go in the URL, so a
     reload or a shared link reopens them. -->
<NavigationStack title="Settings" browser-back history-key="settings">
  <NavigationLink route="general" destination-title="General">
    <template #destination>…</template>
  </NavigationLink>

  <!-- rows sharing a route tell themselves apart by param -->
  <ForEach :items="users" key-path="id">
    <template #default="{ item }">
      <NavigationLink route="user" :param="item.id">
        <template #destination>…</template>
      </NavigationLink>
    </template>
  </ForEach>
</NavigationStack>

<!-- ?settings=general  ·  ?settings=user~42 -->`,
    sources: [
      'src/components/navigation/NavigationStack.vue',
      'src/components/navigation/NavigationLink.vue',
    ],
  },
  typography: {
    code: `<Text font="largeTitle">Large Title</Text>
<Text font="headline">Headline</Text>
<Text font="caption" foreground-color="secondary">Caption</Text>

<Text bold>Bold</Text>
<Text italic>Italic</Text>
<Text underline>Underline</Text>
<Text strikethrough>Strike</Text>

<Text :line-limit="2">Truncated after two lines…</Text>
<Text font-weight="semibold">semibold</Text>`,
    sources: ['src/components/text/SVText.vue', 'src/utils/theme.ts'],
  },
  label: {
    code: `<Label system-image="\\uD83D\\uDCC1">Documents</Label>
<Label system-image="\\uD83D\\uDCF7" icon-color="var(--swift-blue)">Photos</Label>`,
    sources: ['src/components/text/SVLabel.vue'],
  },
  buttons: {
    code: `<Button button-style="borderedProminent" @tap="save">Prominent</Button>
<Button button-style="bordered">Bordered</Button>
<Button button-style="borderless">Borderless</Button>
<Button button-style="plain">Plain</Button>

<Button button-style="borderedProminent" role="destructive">Delete</Button>
<Button button-style="borderedProminent" disabled>Disabled</Button>
<Button button-style="borderedProminent" full-width>Full Width</Button>`,
    sources: ['src/components/controls/SVButton.vue'],
  },
  textFields: {
    code: `<TextField v-model="username" placeholder="Username" />
<TextField v-model="query" placeholder="Search..." text-field-style="roundedBorder" />
<SecureField v-model="password" placeholder="Password" />
<TextEditor v-model="bio" placeholder="Write something..." />
<TextField model-value="Read only" disabled />`,
    sources: ['src/components/input/SVTextField.vue', 'src/components/input/SecureField.vue', 'src/components/input/TextEditor.vue'],
  },
  focusState: {
    code: `const field = useFocusState<'id' | 'password'>()

<TextField
  v-model="id"
  v-model:focused="field"
  focus-value="id"
  @submit="field = 'password'"
/>
<SecureField
  v-model="password"
  v-model:focused="field"
  focus-value="password"
  @submit="field = null"
/>

<Button @tap="field = 'id'">Focus ID</Button>`,
    sources: ['src/composables/useFocusState.ts', 'src/components/input/SVTextField.vue'],
  },
  progress: {
    code: `<ProgressView label="Loading" />
<ProgressView :value="65" :total="100" />
<ProgressView :value="30" :total="100" progress-view-style="linear" />

<Alert
  v-model:is-presented="showAlert"
  title="Delete Item?"
  message="This action cannot be undone."
  :actions="[
    { label: 'Cancel', role: 'cancel' },
    { label: 'Delete', role: 'destructive' },
  ]"
  @action="onAction"
/>`,
    sources: ['src/components/feedback/ProgressView.vue', 'src/components/feedback/SVAlert.vue'],
  },
  animation: {
    code: `// every visual difference the mutation causes animates
withAnimation(() => { expanded.value = !expanded.value })
withAnimation(() => items.value.sort(), Animations.spring)
// presets: default linear easeIn easeOut easeInOut
//          spring smooth snappy bouncy

<TransitionView transition="scale">
  <Card v-if="show" />
</TransitionView>

<!-- .asymmetric(insertion:removal:) -->
<TransitionView insertion="moveBottom" removal="opacity">
  <Banner v-if="visible" />
</TransitionView>`,
    sources: ['src/motion/withAnimation.ts', 'src/components/motion/TransitionView.vue'],
  },
  section: {
    code: `<Section header="Profile" footer="Synced across devices.">
  <div class="swift-list-row">Name</div>
  <div class="swift-list-row">Team</div>
</Section>

<!-- DisclosureGroup: folds the rows, state inside survives -->
<Section header="Advanced" collapsible v-model:expanded="open">
  <div class="swift-list-row">Notifications</div>
</Section>`,
    sources: ['src/components/data/Section.vue'],
  },
  refresh: {
    code: `async function reload() {
  items.value = await fetchItems()
}

<!-- pull down from the top; the spinner holds
     until the promise settles -->
<ScrollView :refreshable="reload">
  <Row v-for="item in items" :key="item.id" />
</ScrollView>`,
    sources: ['src/components/layout/ScrollView.vue'],
  },
  toggle: {
    code: `<Toggle v-model="wifiEnabled" label="Wi-Fi" />
<Toggle v-model="bluetooth" tint="var(--swift-blue)" label="Bluetooth" />
<Toggle :model-value="false" disabled label="Disabled" />`,
    sources: ['src/components/controls/Toggle.vue'],
  },
  slider: {
    code: `<Slider v-model="volume" :min="0" :max="100" label="Volume" />
<Slider v-model="brightness" tint="var(--swift-orange)" label="Brightness" />
<Slider v-model="size" :min="10" :max="30" :step="1" label="Font Size" />
<Slider :model-value="40" disabled label="Disabled" />`,
    sources: ['src/components/controls/SVSlider.vue'],
  },
  stepper: {
    code: `<Stepper v-model="quantity" :min="0" :max="99" label="Quantity" />
<Stepper v-model="rating" :min="0" :max="5" label="Rating" />`,
    sources: ['src/components/controls/Stepper.vue'],
  },
  picker: {
    code: `const sizes = [
  { value: 'small', label: 'S' },
  { value: 'medium', label: 'M' },
]

<!-- label is the accessible name, not a drawn one -->
<Picker v-model="size" :options="sizes" picker-style="segmented" label="Size" />
<Picker v-model="fruit" :options="fruits" picker-style="menu" label="Fruit" />
<Picker :model-value="fruit" :options="fruits" disabled label="Fruit" />`,
    sources: ['src/components/controls/Picker.vue'],
  },
  reactive: {
    code: `// .onChange(of:)
onChange(volume, (value, oldValue) => save(value))
onChange(() => props.user, reload, { initial: true })

// Combine subset — nothing runs until sink()
const stop = publisher(searchText)
  .map(s => s.trim())
  .removeDuplicates()
  .debounce(300)
  .sink(query => search(query))`,
    sources: ['src/composables/onChange.ts', 'src/combine/publisher.ts'],
  },
  vstack: {
    code: `<VStack :spacing="4" alignment="leading">
  <Text>Short</Text>
  <Text>A Longer Text</Text>
</VStack>

<!-- alignment: leading | center | trailing -->`,
    sources: ['src/components/layout/VStack.vue'],
  },
  hstack: {
    code: `<HStack :spacing="8" alignment="top">
  <Text font="largeTitle">A</Text>
  <Text font="caption">C</Text>
</HStack>

<!-- alignment: top | center | bottom | firstTextBaseline -->
<!-- wrap is a web addition: rows flow onto more lines -->
<HStack :spacing="8" wrap>…</HStack>`,
    sources: ['src/components/layout/HStack.vue'],
  },
  zstack: {
    code: `<ZStack alignment="bottomTrailing">
  <Avatar />
  <Badge />
</ZStack>

<HStack>
  <Text>Left</Text>
  <Spacer />
  <Text>Right</Text>
</HStack>`,
    sources: ['src/components/layout/ZStack.vue', 'src/components/layout/Spacer.vue'],
  },
  lazyVGrid: {
    code: `<!-- a track count, or a GridItem[] -->
<LazyVGrid :columns="3" :spacing="8">…</LazyVGrid>

<LazyVGrid :columns="[{ adaptive: { minimum: 100 } }]">…</LazyVGrid>

<LazyVGrid :columns="[{ fixed: 80 }, { flexible: {} }]">…</LazyVGrid>

<!-- tracks resolve through minmax(0, …) so a wide child
     never pushes the grid past its container -->`,
    sources: ['src/components/layout/LazyVGrid.vue', 'src/utils/grid.ts'],
  },
  lazyHGrid: {
    code: `<!-- stays content-sized so it can scroll sideways -->
<ScrollView axes="horizontal">
  <LazyHGrid :rows="2" :spacing="8">
    <Card v-for="i in 12" :key="i" />
  </LazyHGrid>
</ScrollView>`,
    sources: ['src/components/layout/LazyHGrid.vue', 'src/utils/grid.ts'],
  },
  scrollView: {
    code: `<ScrollView axes="horizontal" :shows-indicators="false">
  <HStack :spacing="12">
    <Card v-for="i in 10" :key="i" />
  </HStack>
</ScrollView>

<!-- axes: vertical | horizontal | both
     a horizontal scroller takes its width from the parent,
     otherwise it sizes to its content and cannot scroll -->`,
    sources: ['src/components/layout/ScrollView.vue', 'docs/LAYOUT.md'],
  },
  forEach: {
    code: `<ForEach :items="fruits">
  <template #default="{ item, index }">
    <Text>{{ index + 1 }}. {{ item }}</Text>
  </template>
</ForEach>

<!-- keyPath picks the key field -->
<ForEach :items="users" key-path="id">…</ForEach>`,
    sources: ['src/components/data/ForEach.vue'],
  },
  list: {
    code: `<List :items="todos" list-style="insetGrouped">
  <template #default="{ item, index }">
    <HStack>
      <Text>{{ item.title }}</Text>
      <Spacer />
      <Button button-style="plain" @tap="toggle(index)">Done</Button>
    </HStack>
  </template>
</List>`,
    sources: ['src/components/data/SVList.vue'],
  },
  modifiers: {
    code: `<VStack
  :padding="16"
  background="secondaryBackground"
  foreground-color="primary"
  :corner-radius="12"
  :shadow="{ radius: 12, y: 4 }"
  :opacity="0.9"
  :border="{ color: 'var(--swift-blue)', width: 2 }"
  :frame="{ maxWidth: '400px' }"
>…</VStack>`,
    sources: ['src/utils/modifiers.ts'],
  },
  clipShape: {
    code: `<VStack :padding="20" background="orange" clip-shape="circle">…</VStack>
<VStack :padding="[12, 24]" background="teal" clip-shape="capsule">…</VStack>
<VStack :padding="16" background="indigo" clip-shape="roundedRectangle">…</VStack>`,
    sources: ['src/utils/modifiers.ts'],
  },
  colors: {
    code: `<!-- names resolve to iOS system colors -->
<Text foreground-color="red">Red</Text>
<VStack background="secondaryBackground">…</VStack>

// or the CSS variables directly
background: var(--swift-indigo);

// they follow the system appearance; force one with
const scheme = usePreferredColorScheme()
scheme.value = 'dark'
`,
    sources: ['src/utils/theme.ts', 'src/styles/swift.css'],
  },
  listStyles: {
    code: `<List list-style="insetGrouped">…</List>
<List list-style="plain">…</List>
<List list-style="grouped">…</List>
<List list-style="sidebar">…</List>`,
    sources: ['src/components/data/SVList.vue'],
  },
}

// iOS Safari positions `fixed` elements against the large viewport, so the
// bottom edge hides behind the browser toolbar. visualViewport reports the
// actually-visible height, which we mirror into a CSS variable.
let restingHeight = 0
let lastWidth = 0

// A software keyboard shrinks the visual viewport far more than the browser
// toolbars do. Following it would lift the tab bar into the middle of the
// screen and strand a gap underneath, so hold the keyboard-free height and
// let the keyboard overlay the page instead.
const KEYBOARD_THRESHOLD = 150

function syncAppHeight() {
  const viewport = window.visualViewport
  const height = viewport?.height ?? window.innerHeight
  const width = viewport?.width ?? window.innerWidth

  if (width !== lastWidth) {
    lastWidth = width
    restingHeight = 0 // rotation or a real resize — re-measure from scratch
  }
  if (restingHeight && restingHeight - height > KEYBOARD_THRESHOLD) return

  restingHeight = Math.max(restingHeight, height)
  document.documentElement.style.setProperty('--app-height', `${height}px`)
}

// Assets are content-hashed, but a cached index.html keeps pointing at the old
// ones — the page then looks stale with no way to tell. Compare against the
// stamp published beside the bundle and reload once when they diverge.
async function checkForNewBuild() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}version.json`, { cache: 'no-store' })
    if (!res.ok) return
    const latest = (await res.json())?.buildTime
    if (!latest || latest === buildTime) {
      staleBuild.value = false
      return
    }
    // Reload at most once per deploy per session. If the document itself is
    // still served from cache the reload won't help, so surface it on the
    // badge rather than reloading forever.
    const attempted = `swiftvue-reload-${latest}`
    if (sessionStorage.getItem(attempted)) {
      staleBuild.value = true
      return
    }
    sessionStorage.setItem(attempted, '1')
    location.reload()
  } catch {
    // Offline or blocked — keep showing what we already have.
  }
}

function onVisible() {
  if (document.visibilityState === 'visible') checkForNewBuild()
}

// Older iOS Safari ignores touch-action for pinch — block its proprietary
// gesture events too so the demo stays fixed-scale like a native app.
function blockGesture(e: Event) {
  e.preventDefault()
}

onMounted(() => {
  syncAppHeight()
  window.visualViewport?.addEventListener('resize', syncAppHeight)
  window.visualViewport?.addEventListener('scroll', syncAppHeight)
  window.addEventListener('resize', syncAppHeight)
  window.addEventListener('orientationchange', syncAppHeight)

  checkForNewBuild()
  document.addEventListener('visibilitychange', onVisible)
  document.addEventListener('gesturestart', blockGesture)
  document.addEventListener('gesturechange', blockGesture)
})

onUnmounted(() => {
  window.visualViewport?.removeEventListener('resize', syncAppHeight)
  window.visualViewport?.removeEventListener('scroll', syncAppHeight)
  window.removeEventListener('resize', syncAppHeight)
  window.removeEventListener('orientationchange', syncAppHeight)
  document.removeEventListener('visibilitychange', onVisible)
  document.removeEventListener('gesturestart', blockGesture)
  document.removeEventListener('gesturechange', blockGesture)
})
</script>

<template>
  <div class="swift-app playground-shell">
    <div class="version-badge" :class="{ stale: staleBuild }">
      v{{ version }} · {{ buildTime }}<template v-if="staleBuild"> · outdated</template>
    </div>

    <TabView :tabs="tabs" v-model="activeTab">

      <!-- ============ COMPONENTS TAB ============ -->
      <template #components>
        <NavigationStack title="Components" display-mode="large" browser-back history-key="components">
          <VStack :spacing="24" :padding="[16, 0]" alignment="leading" :frame="{ width: '100%' }">

            <Section header="Text">
              <NavigationLink route="typography" destination-title="Typography">
                <Label system-image="🔤">Typography</Label>
                <template #destination>
                  <VStack :spacing="20" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <VStack :spacing="6" alignment="leading" :padding="[12, 16]" background="secondaryBackground" :corner-radius="12" :frame="{ width: '100%' }">
                      <Text font="largeTitle">Large Title</Text>
                      <Text font="title">Title</Text>
                      <Text font="title2">Title 2</Text>
                      <Text font="title3">Title 3</Text>
                      <Text font="headline">Headline</Text>
                      <Text font="body">Body text</Text>
                      <Text font="callout">Callout</Text>
                      <Text font="subheadline">Subheadline</Text>
                      <Text font="footnote">Footnote</Text>
                      <Text font="caption">Caption</Text>
                      <Text font="caption2">Caption 2</Text>
                    </VStack>

                    <HStack :spacing="16" wrap>
                      <Text bold>Bold</Text>
                      <Text italic>Italic</Text>
                      <Text underline>Underline</Text>
                      <Text strikethrough>Strike</Text>
                    </HStack>

                    <Text font="body" :line-limit="2">
                      This is a long text that demonstrates the lineLimit modifier.
                      It will be truncated after two lines with an ellipsis indicator.
                      You should not see this third line because of the line limit.
                    </Text>

                    <VStack :spacing="4" alignment="leading" :padding="[12, 16]" background="secondaryBackground" :corner-radius="12" :frame="{ width: '100%' }">
                      <Text font-weight="ultraLight">ultraLight</Text>
                      <Text font-weight="light">light</Text>
                      <Text font-weight="regular">regular</Text>
                      <Text font-weight="medium">medium</Text>
                      <Text font-weight="semibold">semibold</Text>
                      <Text font-weight="bold">bold</Text>
                      <Text font-weight="black">black</Text>
                    </VStack>
                    <CodeSample v-bind="samples.typography" />
                  </VStack>
                </template>
              </NavigationLink>

              <NavigationLink route="label" destination-title="Label">
                <Label system-image="🏷️">Label</Label>
                <template #destination>
                  <VStack :spacing="12" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <Label system-image="📁">Documents</Label>
                    <Label system-image="📷" icon-color="var(--swift-blue)">Photos</Label>
                    <Label system-image="🎵" icon-color="var(--swift-red)">Music</Label>
                    <Label system-image="⬇️" icon-color="var(--swift-green)">Downloads</Label>
                    <CodeSample v-bind="samples.label" />
                  </VStack>
                </template>
              </NavigationLink>
            </Section>

            <Section header="Buttons & Inputs">
              <NavigationLink route="buttons" destination-title="Buttons">
                <Label system-image="🔘">Button Styles</Label>
                <template #destination>
                  <VStack :spacing="12" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <HStack :spacing="8" wrap>
                      <Button button-style="borderedProminent">Prominent</Button>
                      <Button button-style="bordered">Bordered</Button>
                      <Button button-style="borderless">Borderless</Button>
                      <Button button-style="plain">Plain</Button>
                    </HStack>
                    <HStack :spacing="8" wrap>
                      <Button button-style="borderedProminent" role="destructive">Delete</Button>
                      <Button button-style="bordered" role="cancel">Cancel</Button>
                      <Button button-style="borderedProminent" disabled>Disabled</Button>
                    </HStack>
                    <Button button-style="borderedProminent" full-width @tap="showSheet = true">
                      Full Width Button (Open Sheet)
                    </Button>
                    <CodeSample v-bind="samples.buttons" />
                  </VStack>
                </template>
              </NavigationLink>

              <NavigationLink route="text-fields" destination-title="Text Fields">
                <Label system-image="⌨️">Text Fields</Label>
                <template #destination>
                  <VStack :spacing="12" :padding="16" alignment="leading" :frame="{ maxWidth: '400px', width: '100%' }">
                    <VStack :spacing="4" alignment="leading" :frame="{ width: '100%' }">
                      <Text font="caption" foreground-color="secondary">TextField (plain)</Text>
                      <TextField v-model="username" placeholder="Username" />
                    </VStack>
                    <VStack :spacing="4" alignment="leading" :frame="{ width: '100%' }">
                      <Text font="caption" foreground-color="secondary">TextField (roundedBorder)</Text>
                      <TextField v-model="searchText" placeholder="Search..." text-field-style="roundedBorder" />
                    </VStack>
                    <VStack :spacing="4" alignment="leading" :frame="{ width: '100%' }">
                      <Text font="caption" foreground-color="secondary">SecureField</Text>
                      <SecureField v-model="password" placeholder="Password" />
                    </VStack>
                    <VStack :spacing="4" alignment="leading" :frame="{ width: '100%' }">
                      <Text font="caption" foreground-color="secondary">TextEditor</Text>
                      <TextEditor v-model="bio" placeholder="Write something..." />
                    </VStack>
                    <VStack :spacing="4" alignment="leading" :frame="{ width: '100%' }">
                      <Text font="caption" foreground-color="secondary">Disabled TextField</Text>
                      <TextField model-value="Read only" disabled text-field-style="roundedBorder" />
                    </VStack>
                    <CodeSample v-bind="samples.textFields" />
                  </VStack>
                </template>
              </NavigationLink>

              <NavigationLink route="focusstate" destination-title="FocusState">
                <Label system-image="🎯">FocusState</Label>
                <template #destination>
                  <VStack :spacing="12" :padding="16" alignment="leading" :frame="{ maxWidth: '400px', width: '100%' }">
                    <Text font="caption" foreground-color="secondary">
                      Focused field: {{ focusedField ?? 'none' }}
                    </Text>
                    <TextField
                      v-model="loginId"
                      v-model:focused="focusedField"
                      focus-value="id"
                      placeholder="ID"
                      text-field-style="roundedBorder"
                      @submit="focusedField = 'password'"
                    />
                    <SecureField
                      v-model="loginPassword"
                      v-model:focused="focusedField"
                      focus-value="password"
                      placeholder="Password"
                      @submit="focusedField = null"
                    />
                    <HStack :spacing="8" wrap>
                      <Button button-style="bordered" @tap="focusedField = 'id'">Focus ID</Button>
                      <Button button-style="bordered" @tap="focusedField = 'password'">Focus Password</Button>
                      <Button button-style="plain" @tap="focusedField = null">Dismiss</Button>
                    </HStack>
                    <Text font="caption" foreground-color="secondary">
                      Enter in ID moves focus to Password, just like SwiftUI's @FocusState.
                    </Text>
                    <CodeSample v-bind="samples.focusState" />
                  </VStack>
                </template>
              </NavigationLink>
            </Section>

            <Section header="Feedback">
              <NavigationLink route="progress-alerts" destination-title="Progress & Alerts">
                <Label system-image="⏳">Progress & Alerts</Label>
                <template #destination>
                  <VStack :spacing="16" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <HStack :spacing="24" alignment="center" wrap>
                      <VStack :spacing="8">
                        <ProgressView label="Loading" />
                        <Text font="caption" foreground-color="secondary">Indeterminate</Text>
                      </VStack>
                      <VStack :spacing="8">
                        <ProgressView :value="downloadProgress" :total="100" />
                        <Text font="caption" foreground-color="secondary">{{ downloadProgress }}%</Text>
                      </VStack>
                      <VStack :spacing="8" :frame="{ width: '150px' }">
                        <ProgressView :value="progress" :total="100" progress-view-style="linear" label="Progress" />
                        <Text font="caption" foreground-color="secondary">Linear {{ progress }}%</Text>
                      </VStack>
                    </HStack>
                    <Button button-style="bordered" @tap="simulateProgress">Simulate Progress</Button>
                    <HStack :spacing="12" wrap>
                      <Button button-style="borderedProminent" @tap="showAlert = true">Show Alert</Button>
                      <Button button-style="bordered" role="destructive" @tap="showDeleteAlert = true">
                        Delete Alert
                      </Button>
                    </HStack>
                    <CodeSample v-bind="samples.progress" />
                  </VStack>
                </template>
              </NavigationLink>

              <NavigationLink route="gauge" destination-title="Gauge">
                <Label system-image="🎚">Gauge</Label>
                <template #destination>
                  <VStack :spacing="20" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <HStack :spacing="24" alignment="center" wrap>
                      <Gauge :value="signal" label="Signal" :current-value-label="`${Math.round(signal * 100)}%`" />
                      <Gauge :value="battery" :min="0" :max="100" label="Battery" tint="green" :size="72" />
                      <Gauge :value="3.4" :min="0" :max="5" label="Rating" tint="orange" current-value-label="3.4" />
                    </HStack>

                    <Slider v-model="signal" :min="0" :max="1" :step="0.01" label="Signal" />

                    <Gauge
                      gauge-style="linear"
                      :value="battery"
                      :min="0"
                      :max="100"
                      label="Battery"
                      :current-value-label="`${battery}%`"
                      minimum-value-label="0"
                      maximum-value-label="100"
                      tint="green"
                    />
                    <Stepper v-model="battery" :min="0" :max="100" :step="5" label="Battery" />

                    <CodeSample v-bind="samples.gauge" />
                  </VStack>
                </template>
              </NavigationLink>

              <NavigationLink route="tab-badge" destination-title="Tab Badge">
                <Label system-image="🔴">Tab Badge</Label>
                <template #destination>
                  <VStack :spacing="16" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <Text font="subheadline" foreground-color="secondary">
                      Components 탭을 보세요 — 아래 숫자가 그대로 반영됩니다.
                    </Text>
                    <Stepper v-model="unread" :min="0" :max="120" label="Unread" />
                    <Text font="footnote" foreground-color="secondary">
                      0이면 뱃지가 사라지고, 99를 넘으면 99+로 줄지만 스크린리더는 실제 숫자를 읽습니다.
                    </Text>
                    <CodeSample v-bind="samples.badge" />
                  </VStack>
                </template>
              </NavigationLink>

              <NavigationLink @tap="showSheet = true">
                <Label system-image="📄">Sheet</Label>
              </NavigationLink>
            </Section>

            <Section header="Gestures & Submit">
              <NavigationLink route="swipe" destination-title="Swipe & Submit">
                <Label system-image="👉">Swipe Actions / onSubmit</Label>
                <template #destination>
                  <VStack :spacing="20" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <Text font="subheadline" foreground-color="secondary">
                      행을 왼쪽으로 밀면 액션이 나옵니다. 끝까지 밀면 첫 액션이 바로 실행됩니다.
                    </Text>

                    <VStack :spacing="1" :frame="{ width: '100%' }" background="separator" :corner-radius="12">
                      <SwipeActions
                        v-for="mail in inbox"
                        :key="mail.id"
                        :trailing="[
                          { label: 'Delete', id: 'del', role: 'destructive', systemImage: '🗑' },
                          { label: 'Flag', id: 'flag', tint: 'orange', systemImage: '🚩' },
                        ]"
                        :leading="[{ label: 'Pin', id: 'pin', tint: 'indigo', systemImage: '📌' }]"
                        @select="onSwipeAction($event, mail.id)"
                      >
                        <HStack :spacing="12" :padding="[12, 16]" :frame="{ width: '100%' }">
                          <VStack :spacing="2" alignment="leading">
                            <Text font="headline">{{ mail.from }}</Text>
                            <Text font="subheadline" foreground-color="secondary">{{ mail.subject }}</Text>
                          </VStack>
                          <Spacer />
                        </HStack>
                      </SwipeActions>
                    </VStack>

                    <Text font="subheadline" data-testid="swipe-log">{{ swipeLog }}</Text>

                    <Divider />

                    <Text font="subheadline" foreground-color="secondary">
                      onSubmit — 아래 칸에서 Enter를 눌러보세요. 핸들러는 화면 하나에 한 번만 답니다.
                    </Text>
                    <TextField v-model="submitQuery" placeholder="Search" text-field-style="roundedBorder" />
                    <Text font="subheadline" data-testid="submit-log">{{ submitted }}</Text>

                    <CodeSample v-bind="samples.submitSwipe" />
                  </VStack>
                </template>
              </NavigationLink>
            </Section>

            <Section header="Lifecycle">
              <NavigationLink route="appear" destination-title="onAppear">
                <Label system-image="👋">onAppear / onDisappear</Label>
                <template #destination>
                  <VStack :spacing="16" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <Text font="subheadline" foreground-color="secondary">
                      아래 화면으로 들어갔다 뒤로 나와 보세요. 이 화면은 언마운트되지 않지만
                      가려졌다가 다시 보였으므로 두 숫자가 모두 올라갑니다.
                    </Text>
                    <VStack
                      :spacing="8"
                      :padding="[12, 16]"
                      background="secondaryBackground"
                      :corner-radius="12"
                      :frame="{ width: '100%' }"
                    >
                      <AppearCounter />
                    </VStack>

                    <NavigationLink route="appear-detail" destination-title="Detail">
                      <Label system-image="➡️">화면 하나 더 쌓기</Label>
                      <template #destination>
                        <VStack :spacing="12" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                          <Text>뒤로 가면 앞 화면의 onAppear가 다시 호출됩니다.</Text>
                        </VStack>
                      </template>
                    </NavigationLink>

                    <CodeSample v-bind="samples.lifecycle" />
                  </VStack>
                </template>
              </NavigationLink>
            </Section>

            <Section header="Motion">
              <NavigationLink route="animation" destination-title="Animation">
                <Label system-image="✨">Animation</Label>
                <template #destination>
                  <VStack :spacing="16" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <Text font="subheadline" foreground-color="secondary">TransitionView — .transition(_:)</Text>
                    <HStack :spacing="8" wrap>
                      <Button button-style="bordered" @tap="showBox = !showBox">
                        {{ showBox ? 'Hide' : 'Show' }}
                      </Button>
                      <Picker v-model="boxTransition" :options="transitionOptions" picker-style="segmented" label="Transition" />
                    </HStack>
                    <div :style="{ minHeight: '76px' }">
                      <TransitionView :transition="boxTransition">
                        <VStack v-if="showBox" data-testid="transition-box" :padding="16" background="blue"
                          :corner-radius="12" foreground-color="white" :frame="{ width: '160px' }">
                          <Text font="headline">{{ boxTransition }}</Text>
                        </VStack>
                      </TransitionView>
                    </div>

                    <Text font="subheadline" foreground-color="secondary">withAnimation — 카드 확장 + 리스트 셔플</Text>
                    <HStack :spacing="8" wrap>
                      <Button button-style="bordered" @tap="withAnimation(() => { expanded = !expanded })">
                        {{ expanded ? 'Collapse' : 'Expand' }}
                      </Button>
                      <Button button-style="bordered" @tap="withAnimation(() => shuffle(), Animations.spring)">
                        Shuffle (spring)
                      </Button>
                      <Button button-style="bordered" @tap="withAnimation(() => shuffle(), Animations.bouncy)">
                        Shuffle (bouncy)
                      </Button>
                    </HStack>
                    <VStack :spacing="8" alignment="leading" :padding="16" background="secondaryBackground"
                      :corner-radius="12" :frame="{ width: '100%' }">
                      <Text font="headline">Animated card</Text>
                      <Text v-if="expanded" font="subheadline" foreground-color="secondary">
                        This extra content appears through the View Transitions API —
                        every visual difference caused by the state change animates,
                        exactly like SwiftUI's withAnimation.
                      </Text>
                      <HStack :spacing="8" wrap>
                        <VStack v-for="n in shuffled" :key="n" :padding="[10, 14]" :corner-radius="8"
                          :style="{ background: colors[(n - 1) % colors.length].var }">
                          <Text font="caption" foreground-color="white" bold>{{ n }}</Text>
                        </VStack>
                      </HStack>
                    </VStack>
                    <CodeSample v-bind="samples.animation" />
                  </VStack>
                </template>
              </NavigationLink>
            </Section>

            <Section header="Media">
              <NavigationLink route="image" destination-title="Image">
                <Label system-image="🖼️">Image & AsyncImage</Label>
                <template #destination>
                  <VStack :spacing="16" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <Text font="subheadline" foreground-color="secondary">Image — contentMode</Text>
                    <HStack :spacing="12" wrap>
                      <VStack :spacing="4">
                        <Image :src="sampleImage" alt="fit" resizable content-mode="fit"
                          :frame="{ width: '110px', height: '110px' }" :corner-radius="12"
                          background="secondaryBackground" />
                        <Text font="caption2" foreground-color="secondary">fit</Text>
                      </VStack>
                      <VStack :spacing="4">
                        <Image :src="sampleImage" alt="fill" resizable content-mode="fill"
                          :frame="{ width: '110px', height: '110px' }" :corner-radius="12" />
                        <Text font="caption2" foreground-color="secondary">fill</Text>
                      </VStack>
                      <VStack :spacing="4">
                        <Image :src="sampleImage" alt="circle" resizable content-mode="fill"
                          :frame="{ width: '110px', height: '110px' }" clip-shape="circle" />
                        <Text font="caption2" foreground-color="secondary">clipShape</Text>
                      </VStack>
                    </HStack>

                    <Text font="subheadline" foreground-color="secondary">AsyncImage — 로딩 / 실패</Text>
                    <HStack :spacing="12" wrap>
                      <AsyncImage :url="sampleImage" alt="loaded"
                        :frame="{ width: '110px', height: '110px' }" :corner-radius="12"
                        background="secondaryBackground" />
                      <AsyncImage url="/does-not-exist.png" alt="broken"
                        :frame="{ width: '110px', height: '110px' }" :corner-radius="12"
                        background="secondaryBackground" />
                    </HStack>
                    <CodeSample v-bind="samples.media" />
                  </VStack>
                </template>
              </NavigationLink>
            </Section>

            <Section header="Forms">
              <NavigationLink route="form-datepicker" destination-title="Form & DatePicker">
                <Label system-image="📝">Form & DatePicker</Label>
                <template #destination>
                  <VStack :spacing="16" :padding="16" alignment="leading" :frame="{ maxWidth: '500px', width: '100%' }">
                    <Form @submit="submitForm">
                      <Section header="Details" footer="Enter 또는 Save로 제출됩니다.">
                        <div class="swift-list-row">
                          <VStack :spacing="6" alignment="leading" :frame="{ width: '100%' }">
                            <Label for="form-name">Name</Label>
                            <TextField id="form-name" v-model="formName" placeholder="Name" text-field-style="roundedBorder" />
                          </VStack>
                        </div>
                        <div class="swift-list-row">
                          <HStack><Text>Due date</Text><Spacer /><DatePicker v-model="dueDate" label="Due date" /></HStack>
                        </div>
                        <div class="swift-list-row">
                          <HStack><Text>Time</Text><Spacer /><DatePicker v-model="meetingTime" displayed-components="hourAndMinute" label="Time" /></HStack>
                        </div>
                      </Section>
                      <Button type="submit" button-style="borderedProminent" full-width>Save</Button>
                    </Form>
                    <Text v-if="formSubmitted" font="subheadline" foreground-color="green">{{ formSubmitted }}</Text>
                    <CodeSample v-bind="samples.form" />
                  </VStack>
                </template>
              </NavigationLink>

              <NavigationLink route="menu" destination-title="Menu">
                <Label system-image="⋯">Menu</Label>
                <template #destination>
                  <VStack :spacing="16" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <Menu label="More" :actions="menuActions" @select="menuChoice = `선택: ${$event.label}`" />
                    <Text font="subheadline" data-testid="menu-choice">{{ menuChoice }}</Text>
                    <Text font="caption" foreground-color="secondary">
                      ↓/↑로 이동, Esc로 닫기, 바깥을 누르면 닫힙니다.
                    </Text>
                    <CodeSample v-bind="samples.menu" />
                  </VStack>
                </template>
              </NavigationLink>

              <NavigationLink route="context-menu" destination-title="Context Menu">
                <Label system-image="👆">Context Menu</Label>
                <template #destination>
                  <VStack :spacing="16" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <Text font="subheadline" foreground-color="secondary">
                      길게 누르거나(모바일), 우클릭하거나, Shift+F10을 눌러보세요.
                    </Text>
                    <ContextMenu
                      label="Photo actions"
                      :actions="contextActions"
                      @select="contextChoice = `선택: ${$event.label}`"
                    >
                      <VStack
                        :spacing="6"
                        :padding="[24, 20]"
                        alignment="center"
                        background="secondaryBackground"
                        :corner-radius="14"
                      >
                        <Text font="largeTitle">🏔</Text>
                        <Text font="subheadline">Mountain.jpg</Text>
                      </VStack>
                    </ContextMenu>
                    <Text font="subheadline" data-testid="context-choice">{{ contextChoice }}</Text>
                    <CodeSample v-bind="samples.contextMenu" />
                  </VStack>
                </template>
              </NavigationLink>
            </Section>

            <Section header="Data" footer="이 화면 자체가 NavigationStack + Section + NavigationLink 조합입니다.">
              <NavigationLink route="section" destination-title="Section">
                <Label system-image="📚">Section & Collapsible</Label>
                <template #destination>
                  <VStack :spacing="20" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <Section header="Profile" footer="Header와 footer는 SwiftUI Section 그대로입니다.">
                      <div class="swift-list-row">
                        <HStack><Text>Name</Text><Spacer /><Text foreground-color="secondary">Insub</Text></HStack>
                      </div>
                      <div class="swift-list-row">
                        <HStack><Text>Team</Text><Spacer /><Text foreground-color="secondary">iOS</Text></HStack>
                      </div>
                    </Section>

                    <Section v-model:expanded="advancedOpen" header="Advanced" collapsible
                      footer="collapsible — 헤더를 눌러 접고 펼칩니다. 접혀도 내부 상태는 유지됩니다.">
                      <div class="swift-list-row">
                        <HStack>
                          <Label system-image="🔔">Notifications</Label>
                          <Spacer />
                          <Toggle v-model="notifications" label="Notifications" />
                        </HStack>
                      </div>
                      <div class="swift-list-row">
                        <HStack><Text>Items</Text><Spacer /><Stepper v-model="count" :min="0" :max="99" label="Items" /></HStack>
                      </div>
                    </Section>
                    <CodeSample v-bind="samples.section" />
                  </VStack>
                </template>
              </NavigationLink>

              <NavigationLink route="pull-to-refresh" destination-title="Pull to Refresh">
                <Label system-image="🔄">Pull to Refresh</Label>
                <template #destination>
                  <VStack :spacing="12" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <Text font="caption" foreground-color="secondary">
                      .refreshable — 목록 맨 위에서 아래로 당기면 새로고침됩니다.
                    </Text>
                    <div :style="{ height: '260px', display: 'flex', width: '100%' }" data-testid="refresh-area">
                      <ScrollView :refreshable="reload" :frame="{ height: '260px' }"
                        background="secondaryBackground" :corner-radius="12">
                        <VStack :spacing="0" alignment="leading" :frame="{ width: '100%' }">
                          <div v-for="(line, i) in refreshLog" :key="`${line}-${i}`" class="swift-list-row" :style="{ width: '100%' }">
                            <Text font="subheadline">{{ line }}</Text>
                          </div>
                        </VStack>
                      </ScrollView>
                    </div>
                    <CodeSample v-bind="samples.refresh" />
                  </VStack>
                </template>
              </NavigationLink>
            </Section>

          </VStack>
        </NavigationStack>
      </template>

      <!-- ============ CONTROLS TAB ============ -->
      <template #controls>
        <NavigationStack title="Controls" display-mode="large" browser-back history-key="controls">
          <VStack :spacing="24" :padding="[16, 0]" alignment="leading" :frame="{ width: '100%' }">

            <Section header="Controls">
              <NavigationLink route="toggle" destination-title="Toggle">
                <Label system-image="🟢">Toggle</Label>
                <template #destination>
                  <VStack :spacing="0" :padding="16" alignment="leading" :frame="{ maxWidth: '500px', width: '100%' }">
                    <Section>
                      <div class="swift-list-row">
                        <HStack>
                          <Label system-image="🌙">Dark Mode</Label>
                          <Spacer />
                          <Toggle v-model="darkMode" label="Dark Mode" />
                        </HStack>
                      </div>
                      <div class="swift-list-row">
                        <HStack>
                          <Label system-image="📶">Wi-Fi</Label>
                          <Spacer />
                          <Toggle v-model="wifiEnabled" label="Wi-Fi" />
                        </HStack>
                      </div>
                      <div class="swift-list-row">
                        <HStack>
                          <Label system-image="🔵">Bluetooth</Label>
                          <Spacer />
                          <Toggle v-model="bluetoothEnabled" tint="var(--swift-blue)" label="Bluetooth" />
                        </HStack>
                      </div>
                      <div class="swift-list-row">
                        <HStack>
                          <Label system-image="🚫">Disabled</Label>
                          <Spacer />
                          <Toggle :model-value="false" disabled label="Disabled" />
                        </HStack>
                      </div>
                    </Section>
                    <CodeSample v-bind="samples.toggle" />
                  </VStack>
                </template>
              </NavigationLink>

              <NavigationLink route="slider" destination-title="Slider">
                <Label system-image="🎚️">Slider</Label>
                <template #destination>
                  <VStack :spacing="16" :padding="16" alignment="leading" :frame="{ maxWidth: '500px', width: '100%' }">
                    <VStack :spacing="4" alignment="leading" :frame="{ width: '100%' }">
                      <HStack>
                        <Text font="body">Volume</Text>
                        <Spacer />
                        <Text font="body" foreground-color="secondary">{{ volume }}%</Text>
                      </HStack>
                      <Slider v-model="volume" :min="0" :max="100" label="Volume" />
                    </VStack>
                    <VStack :spacing="4" alignment="leading" :frame="{ width: '100%' }">
                      <HStack>
                        <Text font="body">Brightness</Text>
                        <Spacer />
                        <Text font="body" foreground-color="secondary">{{ brightness }}%</Text>
                      </HStack>
                      <Slider v-model="brightness" :min="0" :max="100" tint="var(--swift-orange)" label="Brightness" />
                    </VStack>
                    <VStack :spacing="4" alignment="leading" :frame="{ width: '100%' }">
                      <HStack>
                        <Text font="body">Font Size</Text>
                        <Spacer />
                        <Text font="body" foreground-color="secondary">{{ fontSize }}px</Text>
                      </HStack>
                      <Slider v-model="fontSize" :min="10" :max="30" :step="1" tint="var(--swift-purple)" label="Font Size" />
                      <Text :style="{ fontSize: fontSize + 'px' }">Preview text at {{ fontSize }}px</Text>
                    </VStack>
                    <VStack :spacing="4" alignment="leading" :frame="{ width: '100%' }">
                      <Text font="body">Disabled</Text>
                      <Slider :model-value="40" :min="0" :max="100" disabled label="Disabled" />
                    </VStack>
                    <CodeSample v-bind="samples.slider" />
                  </VStack>
                </template>
              </NavigationLink>

              <NavigationLink route="stepper" destination-title="Stepper">
                <Label system-image="➕">Stepper</Label>
                <template #destination>
                  <VStack :spacing="0" :padding="16" alignment="leading" :frame="{ maxWidth: '500px', width: '100%' }">
                    <Section>
                      <div class="swift-list-row">
                        <HStack>
                          <Text>Quantity</Text>
                          <Spacer />
                          <Stepper v-model="count" :min="0" :max="99" label="Quantity" />
                        </HStack>
                      </div>
                      <div class="swift-list-row">
                        <HStack>
                          <Text>Rating</Text>
                          <Spacer />
                          <HStack :spacing="4">
                            <Text foreground-color="orange">{{ '★'.repeat(rating) }}{{ '☆'.repeat(5 - rating) }}</Text>
                            <Stepper v-model="rating" :min="0" :max="5" label="Rating" />
                          </HStack>
                        </HStack>
                      </div>
                    </Section>
                    <CodeSample v-bind="samples.stepper" />
                  </VStack>
                </template>
              </NavigationLink>

              <NavigationLink route="picker" destination-title="Picker">
                <Label system-image="📋">Picker</Label>
                <template #destination>
                  <VStack :spacing="16" :padding="16" alignment="leading" :frame="{ maxWidth: '500px', width: '100%' }">
                    <VStack :spacing="8" alignment="leading" :frame="{ width: '100%' }">
                      <Text font="subheadline" foreground-color="secondary">Segmented</Text>
                      <Picker v-model="selectedSize" :options="sizes" picker-style="segmented" label="Size" />
                      <Text font="caption" foreground-color="secondary">Selected: {{ selectedSize }}</Text>
                    </VStack>
                    <VStack :spacing="8" alignment="leading" :frame="{ width: '100%' }">
                      <Text font="subheadline" foreground-color="secondary">Menu (Dropdown)</Text>
                      <Picker v-model="selectedFruit" :options="fruits" picker-style="menu" label="Fruit" />
                      <Text font="caption" foreground-color="secondary">Selected: {{ selectedFruit }}</Text>
                    </VStack>
                    <VStack :spacing="8" alignment="leading" :frame="{ width: '100%' }">
                      <Text font="subheadline" foreground-color="secondary">Disabled</Text>
                      <Picker :model-value="'apple'" :options="fruits" picker-style="segmented" disabled label="Fruit" />
                    </VStack>
                    <CodeSample v-bind="samples.picker" />
                  </VStack>
                </template>
              </NavigationLink>
            </Section>

            <Section header="Reactive">
              <NavigationLink route="onchange-combine" destination-title="onChange & Combine">
                <Label system-image="⚡">onChange & Combine</Label>
                <template #destination>
                  <VStack :spacing="16" :padding="16" alignment="leading" :frame="{ maxWidth: '500px', width: '100%' }">
                    <VStack :spacing="4" alignment="leading" :frame="{ width: '100%' }">
                      <Text font="caption" foreground-color="secondary" :style="{ wordBreak: 'break-all' }">
                        publisher(search).map(trim).removeDuplicates().debounce(400).sink(...)
                      </Text>
                      <TextField v-model="searchInput" placeholder="Search..." text-field-style="roundedBorder" />
                      <Text font="subheadline" data-testid="debounced">
                        debounced: <Text foreground-color="blue" bold>{{ debouncedQuery || '—' }}</Text>
                      </Text>
                    </VStack>
                    <VStack :spacing="4" alignment="leading" :frame="{ width: '100%' }">
                      <Text font="caption" foreground-color="secondary">
                        onChange(volume) — Volume 슬라이더를 움직이면 기록됩니다
                      </Text>
                      <Slider v-model="volume" :min="0" :max="100" label="Volume" />
                      <Text font="subheadline" data-testid="volume-log">{{ volumeLog }}</Text>
                    </VStack>
                    <CodeSample v-bind="samples.reactive" />
                  </VStack>
                </template>
              </NavigationLink>
            </Section>

          </VStack>
        </NavigationStack>
      </template>

      <!-- ============ LAYOUT TAB ============ -->
      <template #layout>
        <NavigationStack title="Layout" display-mode="large" browser-back history-key="layout">
          <VStack :spacing="24" :padding="[16, 0]" alignment="leading" :frame="{ width: '100%' }">

            <Section header="Stacks">
              <NavigationLink route="vstack" destination-title="VStack">
                <Label system-image="⬇️">VStack</Label>
                <template #destination>
                  <VStack :spacing="12" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <HStack :spacing="16" wrap>
                      <VStack :spacing="4" alignment="leading" :padding="12" background="secondaryBackground" :corner-radius="8">
                        <Text font="caption" foreground-color="secondary">leading</Text>
                        <Text foreground-color="blue">Short</Text>
                        <Text foreground-color="blue">Medium Text</Text>
                        <Text foreground-color="blue">A Longer Text</Text>
                      </VStack>
                      <VStack :spacing="4" alignment="center" :padding="12" background="secondaryBackground" :corner-radius="8">
                        <Text font="caption" foreground-color="secondary">center</Text>
                        <Text foreground-color="green">Short</Text>
                        <Text foreground-color="green">Medium Text</Text>
                        <Text foreground-color="green">A Longer Text</Text>
                      </VStack>
                      <VStack :spacing="4" alignment="trailing" :padding="12" background="secondaryBackground" :corner-radius="8">
                        <Text font="caption" foreground-color="secondary">trailing</Text>
                        <Text foreground-color="purple">Short</Text>
                        <Text foreground-color="purple">Medium Text</Text>
                        <Text foreground-color="purple">A Longer Text</Text>
                      </VStack>
                    </HStack>
                    <CodeSample v-bind="samples.vstack" />
                  </VStack>
                </template>
              </NavigationLink>

              <NavigationLink route="hstack" destination-title="HStack">
                <Label system-image="➡️">HStack</Label>
                <template #destination>
                  <VStack :spacing="8" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <HStack :spacing="8" alignment="top" :padding="12" background="secondaryBackground" :corner-radius="8" :frame="{ width: '100%' }">
                      <Text font="caption" foreground-color="secondary">top:</Text>
                      <Text font="largeTitle" foreground-color="red">A</Text>
                      <Text font="body" foreground-color="red">B</Text>
                      <Text font="caption" foreground-color="red">C</Text>
                    </HStack>
                    <HStack :spacing="8" alignment="center" :padding="12" background="secondaryBackground" :corner-radius="8" :frame="{ width: '100%' }">
                      <Text font="caption" foreground-color="secondary">center:</Text>
                      <Text font="largeTitle" foreground-color="blue">A</Text>
                      <Text font="body" foreground-color="blue">B</Text>
                      <Text font="caption" foreground-color="blue">C</Text>
                    </HStack>
                    <HStack :spacing="8" alignment="bottom" :padding="12" background="secondaryBackground" :corner-radius="8" :frame="{ width: '100%' }">
                      <Text font="caption" foreground-color="secondary">bottom:</Text>
                      <Text font="largeTitle" foreground-color="green">A</Text>
                      <Text font="body" foreground-color="green">B</Text>
                      <Text font="caption" foreground-color="green">C</Text>
                    </HStack>
                    <CodeSample v-bind="samples.hstack" />
                  </VStack>
                </template>
              </NavigationLink>

              <NavigationLink route="zstack-spacer" destination-title="ZStack & Spacer">
                <Label system-image="🔳">ZStack & Spacer</Label>
                <template #destination>
                  <VStack :spacing="16" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <Text font="subheadline" foreground-color="secondary">ZStack</Text>
                    <HStack :spacing="16" wrap>
                      <ZStack :frame="{ width: '120px', height: '120px' }">
                        <div :style="{ width: '100px', height: '100px', borderRadius: '16px', background: 'var(--swift-blue)', opacity: 0.3 }" />
                        <div :style="{ width: '70px', height: '70px', borderRadius: '12px', background: 'var(--swift-blue)', opacity: 0.5 }" />
                        <div :style="{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--swift-blue)' }" />
                      </ZStack>
                      <ZStack :frame="{ width: '100px', height: '100px' }">
                        <div :style="{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--swift-green)', opacity: 0.2 }" />
                        <Text font="largeTitle">🌿</Text>
                      </ZStack>
                      <ZStack alignment="bottomTrailing" :frame="{ width: '80px', height: '80px' }">
                        <div :style="{ width: '70px', height: '70px', borderRadius: '50%', background: 'var(--swift-purple)', opacity: 0.3 }" />
                        <Text font="title3">👤</Text>
                        <div :style="{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--swift-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
                          <Text font="caption2" foreground-color="white">✓</Text>
                        </div>
                      </ZStack>
                    </HStack>

                    <Text font="subheadline" foreground-color="secondary">Spacer</Text>
                    <HStack :padding="12" background="secondaryBackground" :corner-radius="8" :frame="{ width: '100%' }">
                      <Text foreground-color="blue">Left</Text>
                      <Spacer />
                      <Text foreground-color="red">Right</Text>
                    </HStack>
                    <HStack :padding="12" background="secondaryBackground" :corner-radius="8" :frame="{ width: '100%' }">
                      <Text foreground-color="green">A</Text>
                      <Spacer />
                      <Text foreground-color="orange">B</Text>
                      <Spacer />
                      <Text foreground-color="purple">C</Text>
                    </HStack>
                    <CodeSample v-bind="samples.zstack" />
                  </VStack>
                </template>
              </NavigationLink>
            </Section>

            <Section header="Grids">
              <NavigationLink route="lazyvgrid" destination-title="LazyVGrid">
                <Label system-image="🔲">LazyVGrid</Label>
                <template #destination>
                  <VStack :spacing="12" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <Text font="caption" foreground-color="secondary">columns: 3</Text>
                    <LazyVGrid :columns="3" :spacing="8">
                      <VStack v-for="i in 6" :key="i" :padding="12" :corner-radius="10"
                        :frame="{ width: '100%' }" background="secondaryBackground">
                        <Text font="subheadline">{{ i }}</Text>
                      </VStack>
                    </LazyVGrid>

                    <Text font="caption" foreground-color="secondary">
                      columns: [{ adaptive: { minimum: 100 } }]
                    </Text>
                    <LazyVGrid :columns="[{ adaptive: { minimum: 100 } }]" :spacing="8">
                      <VStack v-for="i in 5" :key="i" :padding="12" :corner-radius="10"
                        :frame="{ width: '100%' }" background="secondaryBackground">
                        <Text font="subheadline">Auto {{ i }}</Text>
                      </VStack>
                    </LazyVGrid>

                    <Text font="caption" foreground-color="secondary">
                      columns: [{ fixed: 80 }, { flexible: {} }]
                    </Text>
                    <LazyVGrid :columns="[{ fixed: 80 }, { flexible: {} }]" :spacing="8">
                      <VStack :padding="12" :corner-radius="10" :frame="{ width: '100%' }" background="blue">
                        <Text font="caption" foreground-color="white">80px</Text>
                      </VStack>
                      <VStack :padding="12" :corner-radius="10" :frame="{ width: '100%' }" background="green">
                        <Text font="caption" foreground-color="white">flexible</Text>
                      </VStack>
                    </LazyVGrid>
                    <CodeSample v-bind="samples.lazyVGrid" />
                  </VStack>
                </template>
              </NavigationLink>

              <NavigationLink route="lazyhgrid" destination-title="LazyHGrid">
                <Label system-image="↔️">LazyHGrid</Label>
                <template #destination>
                  <VStack :spacing="12" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <Text font="caption" foreground-color="secondary">rows: 2, inside a horizontal ScrollView</Text>
                    <ScrollView axes="horizontal" :shows-indicators="false" :frame="{ height: '150px' }">
                      <LazyHGrid :rows="2" :spacing="8">
                        <VStack v-for="i in 12" :key="i" :padding="[16, 12]" :corner-radius="10"
                          :frame="{ width: '110px' }"
                          :style="{ background: colors[(i - 1) % colors.length].var }">
                          <Text font="caption" foreground-color="white" bold>Item {{ i }}</Text>
                        </VStack>
                      </LazyHGrid>
                    </ScrollView>
                    <CodeSample v-bind="samples.lazyHGrid" />
                  </VStack>
                </template>
              </NavigationLink>
            </Section>

            <Section header="Scroll & Data">
              <NavigationLink route="scrollview" destination-title="ScrollView">
                <Label system-image="📜">ScrollView (horizontal)</Label>
                <template #destination>
                  <VStack :spacing="12" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <ScrollView axes="horizontal" :shows-indicators="false" :frame="{ height: '100px' }">
                      <HStack :spacing="12" :padding="[0, 4]">
                        <div v-for="i in 10" :key="i" :style="{
                          minWidth: '140px',
                          height: '80px',
                          borderRadius: '12px',
                          background: colors[(i - 1) % colors.length].var,
                          opacity: 0.8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }">
                          <Text font="headline" foreground-color="white">Card {{ i }}</Text>
                        </div>
                      </HStack>
                    </ScrollView>
                    <CodeSample v-bind="samples.scrollView" />
                  </VStack>
                </template>
              </NavigationLink>

              <NavigationLink route="foreach" destination-title="ForEach">
                <Label system-image="🔁">ForEach</Label>
                <template #destination>
                  <VStack :spacing="12" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <HStack :spacing="8" wrap>
                      <ForEach :items="['🍎', '🍌', '🍒', '🍇', '🍊']">
                        <template #default="{ item, index }">
                          <VStack :spacing="4" :padding="12" background="secondaryBackground" :corner-radius="8">
                            <Text font="title">{{ item }}</Text>
                            <Text font="caption2" foreground-color="secondary">#{{ index + 1 }}</Text>
                          </VStack>
                        </template>
                      </ForEach>
                    </HStack>
                    <CodeSample v-bind="samples.forEach" />
                  </VStack>
                </template>
              </NavigationLink>

              <NavigationLink route="list" destination-title="List">
                <Label system-image="📃">List + Interactive</Label>
                <template #destination>
                  <VStack :spacing="12" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <Text font="subheadline" foreground-color="secondary">
                      {{ completedCount }}/{{ todos.length }} completed ({{ completionPercent }}%)
                    </Text>
                    <List :items="todos" list-style="insetGrouped" :frame="{ width: '100%' }">
                      <template #default="{ item, index }">
                        <HStack :spacing="12">
                          <Text :foreground-color="item.done ? 'green' : 'secondary'" font="title3">
                            {{ item.done ? '✅' : '⬜' }}
                          </Text>
                          <Text :style="{ textDecoration: item.done ? 'line-through' : 'none', opacity: item.done ? 0.6 : 1 }">
                            {{ item.title }}
                          </Text>
                          <Spacer />
                          <Button button-style="plain" @tap="toggleTodo(index)">
                            {{ item.done ? 'Undo' : 'Done' }}
                          </Button>
                        </HStack>
                      </template>
                    </List>
                    <CodeSample v-bind="samples.list" />
                  </VStack>
                </template>
              </NavigationLink>
            </Section>

          </VStack>
        </NavigationStack>
      </template>

      <!-- ============ STYLES TAB ============ -->
      <template #styles>
        <NavigationStack title="Styles" display-mode="large" browser-back history-key="styles">
          <VStack :spacing="24" :padding="[16, 0]" alignment="leading" :frame="{ width: '100%' }">

            <Section header="Styling">
              <NavigationLink route="modifiers" destination-title="Modifiers">
                <Label system-image="🧩">Modifiers</Label>
                <template #destination>
                  <VStack :spacing="12" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <HStack :spacing="12" wrap>
                      <VStack :padding="16" background="blue" :corner-radius="12" foreground-color="white">
                        <Text font="headline">cornerRadius</Text>
                        <Text font="caption">12px</Text>
                      </VStack>
                      <VStack :padding="16" background="green" :corner-radius="20" foreground-color="white">
                        <Text font="headline">cornerRadius</Text>
                        <Text font="caption">20px</Text>
                      </VStack>
                    </HStack>
                    <HStack :spacing="12" wrap>
                      <VStack :padding="16" background="secondaryBackground" :corner-radius="12"
                        :shadow="{ radius: 4, y: 2 }">
                        <Text font="headline">Shadow</Text>
                        <Text font="caption" foreground-color="secondary">radius: 4</Text>
                      </VStack>
                      <VStack :padding="16" background="secondaryBackground" :corner-radius="12"
                        :shadow="{ radius: 12, y: 4 }">
                        <Text font="headline">Shadow</Text>
                        <Text font="caption" foreground-color="secondary">radius: 12</Text>
                      </VStack>
                    </HStack>
                    <HStack :spacing="12" wrap>
                      <VStack :padding="16" background="purple" :corner-radius="12" foreground-color="white" :opacity="1">
                        <Text font="headline">100%</Text>
                      </VStack>
                      <VStack :padding="16" background="purple" :corner-radius="12" foreground-color="white" :opacity="0.7">
                        <Text font="headline">70%</Text>
                      </VStack>
                      <VStack :padding="16" background="purple" :corner-radius="12" foreground-color="white" :opacity="0.4">
                        <Text font="headline">40%</Text>
                      </VStack>
                    </HStack>
                    <HStack :spacing="12" wrap>
                      <VStack :padding="16" :corner-radius="12" :border="{ color: 'var(--swift-blue)', width: 2 }">
                        <Text font="headline" foreground-color="blue">Border</Text>
                      </VStack>
                      <VStack :padding="16" :corner-radius="12" :border="{ color: 'var(--swift-red)', width: 3 }">
                        <Text font="headline" foreground-color="red">Border</Text>
                      </VStack>
                    </HStack>
                    <CodeSample v-bind="samples.modifiers" />
                  </VStack>
                </template>
              </NavigationLink>

              <NavigationLink route="clip-shape" destination-title="Clip Shape">
                <Label system-image="✂️">Clip Shape</Label>
                <template #destination>
                  <VStack :spacing="12" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <HStack :spacing="16" wrap>
                      <VStack :padding="20" background="orange" clip-shape="circle" foreground-color="white">
                        <Text font="headline">Circle</Text>
                      </VStack>
                      <VStack :padding="[12,24]" background="teal" clip-shape="capsule" foreground-color="white">
                        <Text font="headline">Capsule</Text>
                      </VStack>
                      <VStack :padding="16" background="indigo" clip-shape="roundedRectangle" foreground-color="white">
                        <Text font="headline">Rounded</Text>
                      </VStack>
                    </HStack>
                    <CodeSample v-bind="samples.clipShape" />
                  </VStack>
                </template>
              </NavigationLink>
            </Section>

            <Section header="Colors & Lists">
              <NavigationLink route="system-colors" destination-title="System Colors">
                <Label system-image="🎨">System Colors</Label>
                <template #destination>
                  <VStack :spacing="12" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <LazyVGrid :columns="[{ adaptive: { minimum: 80 } }]" :spacing="8">
                      <VStack v-for="c in colors" :key="c.name" :spacing="4" :padding="[16, 8]"
                        :corner-radius="12" :frame="{ width: '100%' }" :style="{ background: c.var }">
                        <Text font="caption" foreground-color="white" bold>{{ c.name }}</Text>
                      </VStack>
                    </LazyVGrid>
                    <CodeSample v-bind="samples.colors" />
                  </VStack>
                </template>
              </NavigationLink>

              <NavigationLink route="list-styles" destination-title="List Styles">
                <Label system-image="📑">List Styles</Label>
                <template #destination>
                  <VStack :spacing="16" :padding="16" alignment="leading" :frame="{ width: '100%' }">
                    <VStack :spacing="4" alignment="leading" :frame="{ width: '100%' }">
                      <Text font="caption" foreground-color="secondary">insetGrouped</Text>
                      <List list-style="insetGrouped" :frame="{ width: '100%' }">
                        <div class="swift-list-row"><Text>Row 1</Text></div>
                        <div class="swift-list-row"><Text>Row 2</Text></div>
                        <div class="swift-list-row"><Text>Row 3</Text></div>
                      </List>
                    </VStack>
                    <VStack :spacing="4" alignment="leading" :frame="{ width: '100%' }">
                      <Text font="caption" foreground-color="secondary">plain</Text>
                      <List list-style="plain" :frame="{ width: '100%' }">
                        <div class="swift-list-row"><Text>Row 1</Text></div>
                        <div class="swift-list-row"><Text>Row 2</Text></div>
                        <div class="swift-list-row"><Text>Row 3</Text></div>
                      </List>
                    </VStack>
                    <CodeSample v-bind="samples.listStyles" />
                  </VStack>
                </template>
              </NavigationLink>
            </Section>

            <Section header="Theme" footer="선택은 usePreferredColorScheme로 저장되어 다음 방문에도 유지됩니다.">
              <div class="swift-list-row">
                <HStack>
                  <Label system-image="🌙">Dark Mode</Label>
                  <Spacer />
                  <Toggle v-model="darkMode" label="Dark Mode" />
                </HStack>
              </div>
            </Section>

            <Text font="footnote" foreground-color="secondary" :frame="{ width: '100%' }"
              :style="{ textAlign: 'center' }">
              SwiftVue v{{ version }}
            </Text>

          </VStack>
        </NavigationStack>
      </template>

    </TabView>

    <!-- Sheet -->
    <Sheet
      v-model:is-presented="showSheet"
      :detents="['medium', 'large']"
      label="SwiftVue Demo"
    >
      <VStack :spacing="16" :padding="[24, 16]" alignment="leading">
        <Text font="title2">SwiftVue Demo</Text>
        <Divider />
        <VStack :spacing="12" alignment="leading" :frame="{ width: '100%' }">
          <Label system-image="🧩">28 Components</Label>
          <Label system-image="🎨">iOS Design System Colors</Label>
          <Label system-image="📐">SwiftUI-style Layout</Label>
          <Label system-image="♿">ARIA Accessibility</Label>
          <Label system-image="🧪">Unit + E2E Tests</Label>
          <Label system-image="🔄">CI/CD Pipeline</Label>
        </VStack>
        <Divider />
        <Text font="body" foreground-color="secondary">
          SwiftUI syntax for Vue.js - use familiar declarative patterns
          like VStack, HStack, Text, Button to build web applications.
        </Text>
        <Button button-style="borderedProminent" full-width @tap="showSheet = false">
          Close
        </Button>
      </VStack>
    </Sheet>

    <!-- Alert -->
    <Alert
      v-model:is-presented="showAlert"
      title="Alert"
      message="This demonstrates the Alert component with accessible focus management."
      :actions="[
        { label: 'Cancel', role: 'cancel' },
        { label: 'OK' },
      ]"
    />

    <!-- Delete Alert -->
    <Alert
      v-model:is-presented="showDeleteAlert"
      title="Delete Item?"
      message="This action cannot be undone."
      :actions="[
        { label: 'Cancel', role: 'cancel' },
        { label: 'Delete', role: 'destructive' },
      ]"
      @action="handleAlertAction"
    />
  </div>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
  background: var(--swift-grouped-background);
  /* native-app feel: panning only — no pinch zoom, no double-tap zoom */
  touch-action: pan-x pan-y;
  -webkit-text-size-adjust: 100%;
}

.playground-shell {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 100vh;
  height: 100svh;
  height: var(--app-height, 100svh);
  display: flex;
  flex-direction: column;
}

.version-badge {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 6px);
  right: 10px;
  z-index: 200;
  padding: 3px 8px;
  border-radius: 999px;
  font-family: var(--swift-font-family);
  font-size: 10px;
  line-height: 1.3;
  color: var(--swift-secondary-label);
  background: color-mix(in srgb, var(--swift-secondary-background) 85%, transparent);
  border: 1px solid var(--swift-separator);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  pointer-events: none;
}

.version-badge.stale {
  color: var(--swift-orange);
  border-color: var(--swift-orange);
}

.playground-shell > div {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.playground-shell .tab-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.playground-shell .tab-bar {
  flex-shrink: 0;
  z-index: 100;
  padding-top: 6px;
  padding-bottom: env(safe-area-inset-bottom, 8px);
  background: color-mix(in srgb, var(--swift-secondary-background) 92%, transparent);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.playground-shell .tab-item {
  min-width: 44px;
  min-height: 44px;
}

.playground-shell .nav-header,
.playground-shell .nav-content > div > div {
  width: min(100%, 1080px);
  margin-inline: auto;
}

@media (min-width: 768px) {
  .playground-shell .nav-header,
  .playground-shell .nav-content > div > div {
    padding-inline: 24px !important;
  }

  .playground-shell .tab-bar {
    width: min(calc(100% - 32px), 720px);
    margin: 0 auto 12px;
    border: 1px solid var(--swift-separator);
    border-radius: 18px;
    box-shadow: 0 12px 32px rgb(0 0 0 / 12%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .playground-shell *,
  .playground-shell *::before,
  .playground-shell *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
