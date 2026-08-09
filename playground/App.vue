<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStorage } from '../src/composables/useAppStorage'
import { version } from '../package.json'

const activeTab = ref('components')
const showSheet = ref(false)
const showAlert = ref(false)
const showDeleteAlert = ref(false)

const username = ref('')
const password = ref('')
const bio = ref('')
const searchText = ref('')

const darkMode = useAppStorage('demo-dark-mode', false)
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

watch(darkMode, (val) => {
  document.documentElement.style.colorScheme = val ? 'dark' : 'light'
})

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
</script>

<template>
  <div class="swift-app playground-shell" :style="{ colorScheme: darkMode ? 'dark' : 'light' }">
    <TabView :tabs="tabs" v-model="activeTab">

      <!-- === COMPONENTS TAB === -->
      <template #components>
        <NavigationStack title="Components" display-mode="large">
          <ScrollView>
            <VStack :spacing="24" :padding="16" alignment="leading">

              <!-- Text & Typography -->
              <VStack :spacing="12" alignment="leading">
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

                <HStack :spacing="16">
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
              <VStack :spacing="12" alignment="leading">
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
              <VStack :spacing="12" alignment="leading">
                <Text font="title2" foreground-color="primary">Button Styles</Text>
                <HStack :spacing="8">
                  <Button button-style="borderedProminent">Prominent</Button>
                  <Button button-style="bordered">Bordered</Button>
                  <Button button-style="borderless">Borderless</Button>
                  <Button button-style="plain">Plain</Button>
                </HStack>
                <HStack :spacing="8">
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
              <VStack :spacing="12" alignment="leading" :frame="{ maxWidth: '400px' }">
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

              <!-- List & Navigation -->
              <VStack :spacing="12" alignment="leading">
                <Text font="title2" foreground-color="primary">List & NavigationLink</Text>

                <List list-style="insetGrouped" :frame="{ maxWidth: '500px' }">
                  <NavigationLink v-for="item in menuItems" :key="item.id" @tap="showAlert = true">
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
              <VStack :spacing="12" alignment="leading">
                <Text font="title2" foreground-color="primary">Feedback</Text>

                <HStack :spacing="24" alignment="center">
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

                <HStack :spacing="12">
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
              <VStack :spacing="12" alignment="leading">
                <Text font="title2" foreground-color="primary">Toggle</Text>
                <List list-style="insetGrouped" :frame="{ maxWidth: '500px' }">
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
              <VStack :spacing="12" alignment="leading" :frame="{ maxWidth: '500px' }">
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
              <VStack :spacing="12" alignment="leading" :frame="{ maxWidth: '500px' }">
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
              <VStack :spacing="12" alignment="leading" :frame="{ maxWidth: '500px' }">
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
              <VStack :spacing="12" alignment="leading">
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
              <VStack :spacing="12" alignment="leading">
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
              <VStack :spacing="12" alignment="leading">
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
              <VStack :spacing="12" alignment="leading">
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
              <VStack :spacing="12" alignment="leading">
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
              <VStack :spacing="12" alignment="leading">
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

              <!-- Todo List with ForEach in List -->
              <VStack :spacing="12" alignment="leading">
                <Text font="title2" foreground-color="primary">List + Interactive</Text>
                <HStack :spacing="8">
                  <Text font="subheadline" foreground-color="secondary">
                    {{ completedCount }}/{{ todos.length }} completed ({{ completionPercent }}%)
                  </Text>
                </HStack>
                <List :items="todos" list-style="insetGrouped" :frame="{ maxWidth: '500px' }">
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
              <VStack :spacing="12" alignment="leading">
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
              <VStack :spacing="12" alignment="leading">
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
              <VStack :spacing="12" alignment="leading">
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
              <VStack :spacing="12" alignment="leading">
                <Text font="title2" foreground-color="primary">System Colors</Text>
                <div class="color-grid">
                  <VStack v-for="c in colors" :key="c.name" :spacing="4" :padding="[16, 8]"
                    :corner-radius="12" :style="{ background: c.var, minWidth: '70px' }">
                    <Text font="caption" foreground-color="white" bold>{{ c.name }}</Text>
                  </VStack>
                </div>
              </VStack>

              <Divider />

              <!-- List Styles -->
              <VStack :spacing="12" alignment="leading">
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
              <VStack :spacing="12" alignment="leading" :frame="{ maxWidth: '500px' }">
                <Text font="title2" foreground-color="primary">Theme</Text>
                <HStack :padding="16" background="secondaryBackground" :corner-radius="12">
                  <Label system-image="🌙">Dark Mode</Label>
                  <Spacer />
                  <Toggle v-model="darkMode" label="Dark Mode" />
                </HStack>
                <Text font="caption" foreground-color="secondary">
                  Toggle dark mode to see all components adapt to the color scheme.
                  This preference is saved via useAppStorage.
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
        <VStack :spacing="12" alignment="leading">
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
}

.playground-shell {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
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

.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
