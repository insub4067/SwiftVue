<script setup lang="ts">
import { computed } from 'vue'
import {
  ScrollView, Section, VStack, HStack, Spacer, Text, Picker,
  usePreferredColorScheme, type ColorScheme,
} from '@swiftvue'

// SwiftUI's `.preferredColorScheme(_:)`. null follows the OS; either value
// overrides it, in both directions, and the choice outlives the session.
const scheme = usePreferredColorScheme()

const OPTIONS = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
]

const selected = computed({
  get: () => scheme.value ?? 'system',
  set: (value: string) => {
    scheme.value = value === 'system' ? null : (value as ColorScheme)
  },
})

const SWATCHES = [
  'label', 'secondaryLabel', 'background', 'secondaryBackground',
  'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink',
]
</script>

<template>
  <ScrollView>
    <VStack :spacing="16" :padding="[8, 0, 24]">
      <Section header="Appearance" footer="System follows the OS setting and changes with it.">
        <HStack :padding="[11, 16]" :spacing="12" data-testid="theme-row">
          <Text>Theme</Text>
          <Spacer />
          <Picker v-model="selected" :options="OPTIONS" />
        </HStack>
      </Section>

      <!-- Every token, so a theme change is visible rather than asserted -->
      <Section header="Tokens">
        <VStack :spacing="0">
          <HStack v-for="name in SWATCHES" :key="name" :padding="[8, 16]" :spacing="12" alignment="center">
            <span class="swatch" :style="{ background: `var(--swift-${name})` }" aria-hidden="true" />
            <Text font="footnote">{{ name }}</Text>
            <Spacer />
            <Text font="caption" foreground-color="secondaryLabel">--swift-{{ name }}</Text>
          </HStack>
        </VStack>
      </Section>
    </VStack>
  </ScrollView>
</template>

<style scoped>
.swatch {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--swift-separator);
  flex: none;
}
</style>
