<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useFocusState } from '../src/composables/useFocusState'
import { usePreferredColorScheme } from '../src/composables/usePreferredColorScheme'
import { withAnimation, Animations } from '../src/motion/withAnimation'
import type { TransitionPreset } from '../src/components/motion/TransitionView.vue'
import { version } from '../package.json'

declare const __BUILD_TIME__: string
const buildTime = __BUILD_TIME__
const staleBuild = ref(false)

const activeTab = ref('components')
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

const colorScheme = usePreferredColorScheme()
const darkMode = computed({
  get: () => colorScheme.value === 'dark',
  set: (v) => { colorScheme.value = v ? 'dark' : 'light' },
})
const volume = ref(50)
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
  { id: 3, title: 'Write unit tests (118 tests)', done: true },
  { id: 4, title: 'Set up CI/CD pipeline', done: true },
  { id: 5, title: 'Publish to npm', done: false },
  { id: 6, title: 'Write documentation', done: false },
])

const menuItems = [
  { id: 'general', icon: '⚙️', title: 'General', subtitle: 'About, Software Update' },
  { id: 'display', icon: '🔆', title: 'Display & Brightness', subtitle: 'Text Size, Bold' },
  { id: 'sounds', icon: '🔔', title: 'Sounds & Haptics', subtitle: 'Volume, Ringtone' },
  { id: 'privacy', icon: '🔒', title: 'Privacy & Security', subtitle: 'Location, Contacts' },
  { id: 'battery', icon: '🔋', title: 'Battery', subtitle: 'Usage, Health' },
]

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

const tabs = [
  { id: 'components', label: 'Components', icon: '🧩' },
  { id: 'controls', label: 'Controls', icon: '🎛️' },
  { id: 'layout', label: 'Layout', icon: '📐' },
  { id: 'styles', label: 'Styles', icon: '🎨' },
]

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

      <!-- === COMPONENTS TAB === -->
      <template #components>
        <NavigationStack title="Components" display-mode="large">
          <ScrollView>
            <VStack :spacing="24" :padding="16" alignment="leading">

              <!-- Text & Typography -->
              <VStack :spacing="12" alignment="leading" :frame="{ width: '100%' }">
                <Text font="title2" foreground-color="primary">Text & Typography</Text>
                <VStack :spacing="6" alignment="leading" :padding="[12, 16]" background="secondaryBackground" :corner-radius="12">
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
              </VStack>

              <Divider />

              <!-- Label -->
              <VStack :spacing="12" alignment="leading" :frame="{ width: '100%' }">
                <Text font="title2" foreground-color="primary">Label</Text>
                <VStack :spacing="8" alignment="leading">
                  <Label system-image="📁">Documents</Label>
                  <Label system-image="📷" icon-color="var(--swift-blue)">Photos</Label>
                  <Label system-image="🎵" icon-color="var(--swift-red)">Music</Label>
                  <Label system-image="⬇️" icon-color="var(--swift-green)">Downloads</Label>
                </VStack>
              </VStack>

              <Divider />

              <!-- Buttons -->
              <VStack :spacing="12" alignment="leading" :frame="{ width: '100%' }">
                <Text font="title2" foreground-color="primary">Button Styles</Text>
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
              </VStack>

              <Divider />

              <!-- Input Fields -->
              <VStack :spacing="12" alignment="leading" :frame="{ maxWidth: '400px', width: '100%' }">
                <Text font="title2" foreground-color="primary">Input Fields</Text>

                <VStack :spacing="4" alignment="leading">
                  <Text font="caption" foreground-color="secondary">TextField (plain)</Text>
                  <TextField v-model="username" placeholder="Username" />
                </VStack>

                <VStack :spacing="4" alignment="leading">
                  <Text font="caption" foreground-color="secondary">TextField (roundedBorder)</Text>
                  <TextField v-model="searchText" placeholder="Search..." text-field-style="roundedBorder" />
                </VStack>

                <VStack :spacing="4" alignment="leading">
                  <Text font="caption" foreground-color="secondary">SecureField</Text>
                  <SecureField v-model="password" placeholder="Password" />
                </VStack>

                <VStack :spacing="4" alignment="leading">
                  <Text font="caption" foreground-color="secondary">TextEditor</Text>
                  <TextEditor v-model="bio" placeholder="Write something..." />
                </VStack>

                <VStack :spacing="4" alignment="leading">
                  <Text font="caption" foreground-color="secondary">Disabled TextField</Text>
                  <TextField model-value="Read only" disabled text-field-style="roundedBorder" />
                </VStack>
              </VStack>

              <Divider />

              <!-- FocusState -->
              <VStack :spacing="12" alignment="leading" :frame="{ maxWidth: '400px', width: '100%' }">
                <Text font="title2" foreground-color="primary">FocusState</Text>
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
              </VStack>

              <Divider />

              <!-- Animation -->
              <VStack :spacing="12" alignment="leading" :frame="{ width: '100%' }">
                <Text font="title2" foreground-color="primary">Animation</Text>

                <Text font="subheadline" foreground-color="secondary">TransitionView — .transition(_:)</Text>
                <HStack :spacing="8" wrap>
                  <Button button-style="bordered" @tap="showBox = !showBox">
                    {{ showBox ? 'Hide' : 'Show' }}
                  </Button>
                  <Picker v-model="boxTransition" :options="transitionOptions" picker-style="segmented" />
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
              </VStack>

              <Divider />

              <!-- List & Navigation -->
              <VStack :spacing="12" alignment="leading" :frame="{ width: '100%' }">
                <Text font="title2" foreground-color="primary">List & NavigationLink</Text>
                <Text font="caption" foreground-color="secondary">
                  처음 두 항목은 실제로 push됩니다 — 뒤로가기 버튼 또는 왼쪽 끝에서
                  오른쪽으로 스와이프해서 돌아옵니다.
                </Text>

                <List list-style="insetGrouped" :frame="{ maxWidth: '500px', width: '100%' }">
                  <NavigationLink destination-title="General">
                    <HStack :spacing="12">
                      <Text font="title3">⚙️</Text>
                      <VStack :spacing="2" alignment="leading">
                        <Text font="body">General</Text>
                        <Text font="caption" foreground-color="secondary">About, Software Update</Text>
                      </VStack>
                    </HStack>
                    <template #destination>
                      <VStack :spacing="16" :padding="16" alignment="leading">
                        <List list-style="insetGrouped" :frame="{ width: '100%' }">
                          <div class="swift-list-row">
                            <HStack><Text>Name</Text><Spacer /><Text foreground-color="secondary">SwiftVue Demo</Text></HStack>
                          </div>
                          <div class="swift-list-row">
                            <HStack><Text>Version</Text><Spacer /><Text foreground-color="secondary">v{{ version }}</Text></HStack>
                          </div>
                          <div class="swift-list-row">
                            <HStack><Text>Components</Text><Spacer /><Text foreground-color="secondary">27</Text></HStack>
                          </div>
                        </List>
                        <Text font="caption" foreground-color="secondary">
                          This view was pushed onto the NavigationStack, exactly like
                          NavigationLink(destination:) in SwiftUI.
                        </Text>
                      </VStack>
                    </template>
                  </NavigationLink>

                  <NavigationLink destination-title="Display & Brightness">
                    <HStack :spacing="12">
                      <Text font="title3">🔆</Text>
                      <VStack :spacing="2" alignment="leading">
                        <Text font="body">Display & Brightness</Text>
                        <Text font="caption" foreground-color="secondary">Text Size, Bold</Text>
                      </VStack>
                    </HStack>
                    <template #destination>
                      <VStack :spacing="16" :padding="16" alignment="leading">
                        <VStack :spacing="8" alignment="leading" :padding="16" background="secondaryBackground"
                          :corner-radius="12" :frame="{ width: '100%' }">
                          <HStack>
                            <Text>Brightness</Text>
                            <Spacer />
                            <Text foreground-color="secondary">{{ brightness }}%</Text>
                          </HStack>
                          <Slider v-model="brightness" :min="0" :max="100" tint="var(--swift-orange)" label="Brightness" />
                        </VStack>
                        <HStack :padding="16" background="secondaryBackground" :corner-radius="12" :frame="{ width: '100%' }">
                          <Label system-image="🌙">Dark Mode</Label>
                          <Spacer />
                          <Toggle v-model="darkMode" label="Dark Mode" />
                        </HStack>
                      </VStack>
                    </template>
                  </NavigationLink>

                  <NavigationLink v-for="item in menuItems.slice(2)" :key="item.id" @tap="showAlert = true">
                    <HStack :spacing="12">
                      <Text font="title3">{{ item.icon }}</Text>
                      <VStack :spacing="2" alignment="leading">
                        <Text font="body">{{ item.title }}</Text>
                        <Text font="caption" foreground-color="secondary">{{ item.subtitle }}</Text>
                      </VStack>
                    </HStack>
                  </NavigationLink>
                </List>
              </VStack>

              <Divider />

              <!-- Feedback -->
              <VStack :spacing="12" alignment="leading" :frame="{ width: '100%' }">
                <Text font="title2" foreground-color="primary">Feedback</Text>

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
              </VStack>

              <Spacer :min-length="20" />
            </VStack>
          </ScrollView>
        </NavigationStack>
      </template>

      <!-- === CONTROLS TAB === -->
      <template #controls>
        <NavigationStack title="Controls" display-mode="large">
          <ScrollView>
            <VStack :spacing="24" :padding="16" alignment="leading">

              <!-- Toggle -->
              <VStack :spacing="12" alignment="leading" :frame="{ width: '100%' }">
                <Text font="title2" foreground-color="primary">Toggle</Text>
                <List list-style="insetGrouped" :frame="{ maxWidth: '500px', width: '100%' }">
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
                      <Label system-image="🔔">Notifications</Label>
                      <Spacer />
                      <Toggle v-model="notifications" tint="var(--swift-red)" label="Notifications" />
                    </HStack>
                  </div>
                  <div class="swift-list-row">
                    <HStack>
                      <Label system-image="🚫">Disabled</Label>
                      <Spacer />
                      <Toggle :model-value="false" disabled label="Disabled" />
                    </HStack>
                  </div>
                </List>
              </VStack>

              <Divider />

              <!-- Slider -->
              <VStack :spacing="12" alignment="leading" :frame="{ maxWidth: '500px', width: '100%' }">
                <Text font="title2" foreground-color="primary">Slider</Text>

                <VStack :spacing="4" alignment="leading">
                  <HStack>
                    <Text font="body">Volume</Text>
                    <Spacer />
                    <Text font="body" foreground-color="secondary">{{ volume }}%</Text>
                  </HStack>
                  <Slider v-model="volume" :min="0" :max="100" label="Volume" />
                </VStack>

                <VStack :spacing="4" alignment="leading">
                  <HStack>
                    <Text font="body">Brightness</Text>
                    <Spacer />
                    <Text font="body" foreground-color="secondary">{{ brightness }}%</Text>
                  </HStack>
                  <Slider v-model="brightness" :min="0" :max="100" tint="var(--swift-orange)" label="Brightness" />
                </VStack>

                <VStack :spacing="4" alignment="leading">
                  <HStack>
                    <Text font="body">Font Size</Text>
                    <Spacer />
                    <Text font="body" foreground-color="secondary">{{ fontSize }}px</Text>
                  </HStack>
                  <Slider v-model="fontSize" :min="10" :max="30" :step="1" tint="var(--swift-purple)" label="Font Size" />
                  <Text :style="{ fontSize: fontSize + 'px' }">Preview text at {{ fontSize }}px</Text>
                </VStack>

                <VStack :spacing="4" alignment="leading">
                  <Text font="body">Disabled</Text>
                  <Slider :model-value="40" :min="0" :max="100" disabled label="Disabled" />
                </VStack>
              </VStack>

              <Divider />

              <!-- Stepper -->
              <VStack :spacing="12" alignment="leading" :frame="{ maxWidth: '500px', width: '100%' }">
                <Text font="title2" foreground-color="primary">Stepper</Text>

                <List list-style="insetGrouped">
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
                </List>
              </VStack>

              <Divider />

              <!-- Picker -->
              <VStack :spacing="12" alignment="leading" :frame="{ maxWidth: '500px', width: '100%' }">
                <Text font="title2" foreground-color="primary">Picker</Text>

                <VStack :spacing="8" alignment="leading">
                  <Text font="subheadline" foreground-color="secondary">Segmented</Text>
                  <Picker v-model="selectedSize" :options="sizes" picker-style="segmented" />
                  <Text font="caption" foreground-color="secondary">Selected: {{ selectedSize }}</Text>
                </VStack>

                <VStack :spacing="8" alignment="leading">
                  <Text font="subheadline" foreground-color="secondary">Menu (Dropdown)</Text>
                  <Picker v-model="selectedFruit" :options="fruits" picker-style="menu" />
                  <Text font="caption" foreground-color="secondary">Selected: {{ selectedFruit }}</Text>
                </VStack>

                <VStack :spacing="8" alignment="leading">
                  <Text font="subheadline" foreground-color="secondary">Disabled</Text>
                  <Picker :model-value="'apple'" :options="fruits" picker-style="segmented" disabled />
                </VStack>
              </VStack>

              <Spacer :min-length="20" />
            </VStack>
          </ScrollView>
        </NavigationStack>
      </template>

      <!-- === LAYOUT TAB === -->
      <template #layout>
        <NavigationStack title="Layout" display-mode="large">
          <ScrollView>
            <VStack :spacing="24" :padding="16" alignment="leading">

              <!-- VStack -->
              <VStack :spacing="12" alignment="leading" :frame="{ width: '100%' }">
                <Text font="title2" foreground-color="primary">VStack</Text>
                <HStack :spacing="16">
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
              </VStack>

              <Divider />

              <!-- HStack -->
              <VStack :spacing="12" alignment="leading" :frame="{ width: '100%' }">
                <Text font="title2" foreground-color="primary">HStack</Text>
                <VStack :spacing="8" alignment="leading">
                  <HStack :spacing="8" alignment="top" :padding="12" background="secondaryBackground" :corner-radius="8">
                    <Text font="caption" foreground-color="secondary">top:</Text>
                    <Text font="largeTitle" foreground-color="red">A</Text>
                    <Text font="body" foreground-color="red">B</Text>
                    <Text font="caption" foreground-color="red">C</Text>
                  </HStack>
                  <HStack :spacing="8" alignment="center" :padding="12" background="secondaryBackground" :corner-radius="8">
                    <Text font="caption" foreground-color="secondary">center:</Text>
                    <Text font="largeTitle" foreground-color="blue">A</Text>
                    <Text font="body" foreground-color="blue">B</Text>
                    <Text font="caption" foreground-color="blue">C</Text>
                  </HStack>
                  <HStack :spacing="8" alignment="bottom" :padding="12" background="secondaryBackground" :corner-radius="8">
                    <Text font="caption" foreground-color="secondary">bottom:</Text>
                    <Text font="largeTitle" foreground-color="green">A</Text>
                    <Text font="body" foreground-color="green">B</Text>
                    <Text font="caption" foreground-color="green">C</Text>
                  </HStack>
                </VStack>
              </VStack>

              <Divider />

              <!-- ZStack -->
              <VStack :spacing="12" alignment="leading" :frame="{ width: '100%' }">
                <Text font="title2" foreground-color="primary">ZStack</Text>
                <HStack :spacing="16">
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
              </VStack>

              <Divider />

              <!-- Spacer -->
              <VStack :spacing="12" alignment="leading" :frame="{ width: '100%' }">
                <Text font="title2" foreground-color="primary">Spacer</Text>
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
              </VStack>

              <Divider />

              <!-- ForEach -->
              <VStack :spacing="12" alignment="leading" :frame="{ width: '100%' }">
                <Text font="title2" foreground-color="primary">ForEach</Text>
                <HStack :spacing="8">
                  <ForEach :items="['🍎', '🍌', '🍒', '🍇', '🍊']">
                    <template #default="{ item, index }">
                      <VStack :spacing="4" :padding="12" background="secondaryBackground" :corner-radius="8">
                        <Text font="title">{{ item }}</Text>
                        <Text font="caption2" foreground-color="secondary">#{{ index + 1 }}</Text>
                      </VStack>
                    </template>
                  </ForEach>
                </HStack>
              </VStack>

              <Divider />

              <!-- ScrollView -->
              <VStack :spacing="12" alignment="leading" :frame="{ width: '100%' }">
                <Text font="title2" foreground-color="primary">ScrollView (horizontal)</Text>
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
              </VStack>

              <Divider />

              <!-- LazyVGrid -->
              <VStack :spacing="12" alignment="leading" :frame="{ width: '100%' }">
                <Text font="title2" foreground-color="primary">LazyVGrid</Text>

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
              </VStack>

              <Divider />

              <!-- LazyHGrid -->
              <VStack :spacing="12" alignment="leading" :frame="{ width: '100%' }">
                <Text font="title2" foreground-color="primary">LazyHGrid</Text>
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
              </VStack>

              <Divider />

              <!-- Todo List with ForEach in List -->
              <VStack :spacing="12" alignment="leading" :frame="{ width: '100%' }">
                <Text font="title2" foreground-color="primary">List + Interactive</Text>
                <HStack :spacing="8">
                  <Text font="subheadline" foreground-color="secondary">
                    {{ completedCount }}/{{ todos.length }} completed ({{ completionPercent }}%)
                  </Text>
                </HStack>
                <List :items="todos" list-style="insetGrouped" :frame="{ maxWidth: '500px', width: '100%' }">
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
              </VStack>

              <Spacer :min-length="20" />
            </VStack>
          </ScrollView>
        </NavigationStack>
      </template>

      <!-- === STYLES TAB === -->
      <template #styles>
        <NavigationStack title="Styles" display-mode="large">
          <ScrollView>
            <VStack :spacing="24" :padding="16" alignment="leading">

              <!-- Modifiers -->
              <VStack :spacing="12" alignment="leading" :frame="{ width: '100%' }">
                <Text font="title2" foreground-color="primary">Modifiers</Text>

                <HStack :spacing="12">
                  <VStack :padding="16" background="blue" :corner-radius="12" foreground-color="white">
                    <Text font="headline">cornerRadius</Text>
                    <Text font="caption">12px</Text>
                  </VStack>
                  <VStack :padding="16" background="green" :corner-radius="20" foreground-color="white">
                    <Text font="headline">cornerRadius</Text>
                    <Text font="caption">20px</Text>
                  </VStack>
                </HStack>

                <HStack :spacing="12">
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
                  <VStack :padding="16" background="secondaryBackground" :corner-radius="12"
                    :shadow="{ radius: 24, y: 8 }">
                    <Text font="headline">Shadow</Text>
                    <Text font="caption" foreground-color="secondary">radius: 24</Text>
                  </VStack>
                </HStack>

                <HStack :spacing="12">
                  <VStack :padding="16" background="purple" :corner-radius="12"
                    foreground-color="white" :opacity="1">
                    <Text font="headline">100%</Text>
                  </VStack>
                  <VStack :padding="16" background="purple" :corner-radius="12"
                    foreground-color="white" :opacity="0.7">
                    <Text font="headline">70%</Text>
                  </VStack>
                  <VStack :padding="16" background="purple" :corner-radius="12"
                    foreground-color="white" :opacity="0.4">
                    <Text font="headline">40%</Text>
                  </VStack>
                </HStack>

                <HStack :spacing="12">
                  <VStack :padding="16" :corner-radius="12" :border="{ color: 'var(--swift-blue)', width: 2 }">
                    <Text font="headline" foreground-color="blue">Border</Text>
                  </VStack>
                  <VStack :padding="16" :corner-radius="12" :border="{ color: 'var(--swift-red)', width: 3 }">
                    <Text font="headline" foreground-color="red">Border</Text>
                  </VStack>
                </HStack>
              </VStack>

              <Divider />

              <!-- Clip Shape -->
              <VStack :spacing="12" alignment="leading" :frame="{ width: '100%' }">
                <Text font="title2" foreground-color="primary">Clip Shape</Text>
                <HStack :spacing="16">
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
              </VStack>

              <Divider />

              <!-- Font Weights -->
              <VStack :spacing="12" alignment="leading" :frame="{ width: '100%' }">
                <Text font="title2" foreground-color="primary">Font Weights</Text>
                <VStack :spacing="4" alignment="leading" :padding="[12, 16]" background="secondaryBackground" :corner-radius="12">
                  <Text font-weight="ultraLight">ultraLight</Text>
                  <Text font-weight="thin">thin</Text>
                  <Text font-weight="light">light</Text>
                  <Text font-weight="regular">regular</Text>
                  <Text font-weight="medium">medium</Text>
                  <Text font-weight="semibold">semibold</Text>
                  <Text font-weight="bold">bold</Text>
                  <Text font-weight="heavy">heavy</Text>
                  <Text font-weight="black">black</Text>
                </VStack>
              </VStack>

              <Divider />

              <!-- Colors -->
              <VStack :spacing="12" alignment="leading" :frame="{ width: '100%' }">
                <Text font="title2" foreground-color="primary">System Colors</Text>
                <LazyVGrid :columns="[{ adaptive: { minimum: 80 } }]" :spacing="8">
                  <VStack v-for="c in colors" :key="c.name" :spacing="4" :padding="[16, 8]"
                    :corner-radius="12" :frame="{ width: '100%' }" :style="{ background: c.var }">
                    <Text font="caption" foreground-color="white" bold>{{ c.name }}</Text>
                  </VStack>
                </LazyVGrid>
              </VStack>

              <Divider />

              <!-- List Styles -->
              <VStack :spacing="12" alignment="leading" :frame="{ width: '100%' }">
                <Text font="title2" foreground-color="primary">List Styles</Text>

                <HStack :spacing="16" alignment="top">
                  <VStack :spacing="4" alignment="leading" :frame="{ maxWidth: '220px' }">
                    <Text font="caption" foreground-color="secondary">insetGrouped</Text>
                    <List list-style="insetGrouped">
                      <div class="swift-list-row"><Text>Row 1</Text></div>
                      <div class="swift-list-row"><Text>Row 2</Text></div>
                      <div class="swift-list-row"><Text>Row 3</Text></div>
                    </List>
                  </VStack>
                  <VStack :spacing="4" alignment="leading" :frame="{ maxWidth: '220px' }">
                    <Text font="caption" foreground-color="secondary">plain</Text>
                    <List list-style="plain">
                      <div class="swift-list-row"><Text>Row 1</Text></div>
                      <div class="swift-list-row"><Text>Row 2</Text></div>
                      <div class="swift-list-row"><Text>Row 3</Text></div>
                    </List>
                  </VStack>
                </HStack>
              </VStack>

              <Divider />

              <!-- Dark Mode Toggle -->
              <VStack :spacing="12" alignment="leading" :frame="{ maxWidth: '500px', width: '100%' }">
                <Text font="title2" foreground-color="primary">Theme</Text>
                <HStack :padding="16" background="secondaryBackground" :corner-radius="12">
                  <Label system-image="🌙">Dark Mode</Label>
                  <Spacer />
                  <Toggle v-model="darkMode" label="Dark Mode" />
                </HStack>
                <Text font="caption" foreground-color="secondary">
                  Toggle dark mode to see all components adapt to the color scheme.
                  This preference is saved via usePreferredColorScheme.
                </Text>
              </VStack>

              <Divider />

              <!-- Version -->
              <VStack :spacing="4" alignment="center" :frame="{ width: '100%' }">
                <Text font="footnote" foreground-color="secondary">SwiftVue v{{ version }}</Text>
              </VStack>

              <Spacer :min-length="20" />
            </VStack>
          </ScrollView>
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
          <Label system-image="🧩">24 Components</Label>
          <Label system-image="🎨">iOS Design System Colors</Label>
          <Label system-image="📐">SwiftUI-style Layout</Label>
          <Label system-image="♿">ARIA Accessibility</Label>
          <Label system-image="🧪">118 Unit Tests</Label>
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
      title="Navigation"
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
