<script setup lang="ts">
import { HStack, VStack, Spacer, Text } from '@swiftvue'

/**
 * A settings row: a label on the leading side, a control on the trailing
 * one.
 *
 * This exists because `Toggle` is only the switch. SwiftUI's
 * `Toggle("Flag it", isOn:)` carries its own label, so writing the row by
 * hand is the one place Kitchen has to do more work than the SwiftUI it
 * mirrors. Doing it once here rather than eleven times below is what an app
 * would do — and it keeps the label text in one place, so it can be handed
 * to the control's `label` prop for the accessible name too.
 */
defineProps<{ title: string, subtitle?: string }>()
</script>

<template>
  <HStack :spacing="12" :padding="[11, 16]" alignment="center" class="form-row">
    <VStack :spacing="2" alignment="leading">
      <Text>{{ title }}</Text>
      <Text v-if="subtitle" font="footnote" foreground-color="secondaryLabel">{{ subtitle }}</Text>
    </VStack>
    <Spacer />
    <slot />
  </HStack>
</template>

<style scoped>
.form-row {
  width: 100%;
}
</style>
