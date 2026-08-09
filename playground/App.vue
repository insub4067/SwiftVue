<script setup lang="ts">
import { ref } from 'vue'

// --- SwiftUI와 동일한 상태 관리 ---
const username = ref('')
const password = ref('')
const bio = ref('')
const darkMode = ref(false)
const volume = ref(50)
const count = ref(3)
const selectedFruit = ref('apple')
const showSheet = ref(false)
const showAlert = ref(false)
const activeTab = ref('home')

const fruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
]

const todos = ref([
  { id: 1, title: 'SwiftVue 컴포넌트 만들기', done: true },
  { id: 2, title: 'Playground 테스트', done: true },
  { id: 3, title: 'npm 패키지 배포', done: false },
  { id: 4, title: 'README 작성', done: false },
])

const tabs = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'profile', label: 'Profile', icon: '👤' },
]

function login() {
  showAlert.value = true
}

function toggleTodo(index: number) {
  todos.value[index].done = !todos.value[index].done
}
</script>

<template>
  <div class="swift-app">
    <TabView :tabs="tabs" v-model="activeTab" :frame="{ height: '100vh' }">

      <!-- Home Tab -->
      <template #home>
        <NavigationStack title="SwiftVue">
          <VStack :spacing="20" :padding="16" alignment="leading">

            <!-- Hero Section -->
            <VStack :spacing="4" alignment="leading">
              <Text font="title2" foreground-color="primary">Welcome to SwiftVue</Text>
              <Text font="subheadline" foreground-color="secondary">
                SwiftUI 문법으로 Vue.js 웹앱을 만들어보세요
              </Text>
            </VStack>

            <Divider />

            <!-- Login Form -->
            <VStack :spacing="12" alignment="leading" :frame="{ maxWidth: '400px' }">
              <Text font="headline">Login</Text>

              <VStack :spacing="8" alignment="leading">
                <Text font="subheadline" foreground-color="secondary">Username</Text>
                <TextField
                  v-model="username"
                  placeholder="Enter username"
                  text-field-style="roundedBorder"
                />
              </VStack>

              <VStack :spacing="8" alignment="leading">
                <Text font="subheadline" foreground-color="secondary">Password</Text>
                <SecureField v-model="password" placeholder="Enter password" />
              </VStack>

              <HStack :spacing="12">
                <Button button-style="borderedProminent" @tap="login" full-width>
                  Sign In
                </Button>
                <Button button-style="bordered" @tap="showSheet = true">
                  Info
                </Button>
              </HStack>
            </VStack>

            <Divider />

            <!-- Todo List -->
            <VStack :spacing="8" alignment="leading">
              <Text font="headline">My Tasks</Text>
              <List :items="todos" list-style="insetGrouped" :frame="{ maxWidth: '400px' }">
                <template #default="{ item, index }">
                  <HStack :spacing="12">
                    <Text :foreground-color="item.done ? 'green' : 'secondary'">
                      {{ item.done ? '✓' : '○' }}
                    </Text>
                    <Text :style="{ textDecoration: item.done ? 'line-through' : 'none' }">
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

          </VStack>
        </NavigationStack>
      </template>

      <!-- Settings Tab -->
      <template #settings>
        <NavigationStack title="Settings">
          <VStack :spacing="16" :padding="16" alignment="leading">

            <List list-style="insetGrouped" :frame="{ maxWidth: '500px' }">
              <div class="swift-list-row">
                <HStack>
                  <Text>Dark Mode</Text>
                  <Spacer />
                  <Toggle v-model="darkMode" />
                </HStack>
              </div>
              <div class="swift-list-row">
                <VStack alignment="leading" :spacing="8">
                  <HStack>
                    <Text>Volume</Text>
                    <Spacer />
                    <Text foreground-color="secondary">{{ volume }}%</Text>
                  </HStack>
                  <Slider v-model="volume" :min="0" :max="100" />
                </VStack>
              </div>
              <div class="swift-list-row">
                <HStack>
                  <Text>Items</Text>
                  <Spacer />
                  <Stepper v-model="count" :min="0" :max="10" />
                </HStack>
              </div>
              <div class="swift-list-row">
                <VStack alignment="leading" :spacing="8">
                  <Text>Fruit</Text>
                  <Picker v-model="selectedFruit" :options="fruits" picker-style="segmented" />
                </VStack>
              </div>
            </List>

            <VStack :spacing="8" alignment="leading" :frame="{ maxWidth: '500px' }">
              <Text font="headline">Progress</Text>
              <HStack :spacing="24">
                <ProgressView />
                <ProgressView :value="65" :total="100" />
                <ProgressView :value="30" :total="100" progress-view-style="linear" :frame="{ width: '150px' }">
                  Loading...
                </ProgressView>
              </HStack>
            </VStack>

          </VStack>
        </NavigationStack>
      </template>

      <!-- Profile Tab -->
      <template #profile>
        <NavigationStack title="Profile">
          <VStack :spacing="16" :padding="16" alignment="center">
            <ZStack>
              <div :style="{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--swift-primary)', opacity: 0.2 }" />
              <Text font="largeTitle">👤</Text>
            </ZStack>

            <Text font="title">{{ username || 'Guest User' }}</Text>
            <Text font="subheadline" foreground-color="secondary">iOS Developer</Text>

            <Divider />

            <VStack :spacing="8" alignment="leading" :frame="{ maxWidth: '400px', width: '100%' }">
              <Text font="headline">Bio</Text>
              <TextEditor v-model="bio" placeholder="Tell us about yourself..." />
            </VStack>

            <HStack :spacing="12">
              <Button button-style="borderedProminent">Save Profile</Button>
              <Button button-style="bordered" role="destructive">Delete Account</Button>
            </HStack>
          </VStack>
        </NavigationStack>
      </template>

    </TabView>

    <!-- Sheet -->
    <Sheet v-model:is-presented="showSheet">
      <VStack :spacing="16" :padding="8">
        <Text font="title2">About SwiftVue</Text>
        <Divider />
        <Text font="body">
          SwiftVue는 iOS 개발자가 익숙한 SwiftUI 문법으로
          Vue.js 웹 앱을 빠르게 개발할 수 있게 해주는
          컴포넌트 라이브러리입니다.
        </Text>
        <Text font="body">
          VStack, HStack, Text, Button 등 SwiftUI의 핵심 컴포넌트를
          그대로 웹에서 사용할 수 있습니다.
        </Text>
        <Button button-style="borderedProminent" full-width @tap="showSheet = false">
          Close
        </Button>
      </VStack>
    </Sheet>

    <!-- Alert -->
    <Alert
      v-model:is-presented="showAlert"
      title="Login"
      :message="`Welcome, ${username || 'Guest'}!`"
      :actions="[
        { label: 'Cancel', role: 'cancel' },
        { label: 'OK' },
      ]"
    />
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
}
</style>
