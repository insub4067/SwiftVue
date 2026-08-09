<script setup lang="ts">
import { ref } from 'vue'
import { onAppear, onDisappear } from '../src/composables/useLifecycle'

// The counter lives in this component, so it survives the pane being covered
// — which is the whole point: the screen is still here, it just cannot be
// seen. Push, come back, and the count has gone up.
const appearances = ref(0)
const departures = ref(0)

onAppear(() => appearances.value++)
onDisappear(() => departures.value++)
</script>

<template>
  <VStack :spacing="8" alignment="leading" :frame="{ width: '100%' }">
    <HStack :frame="{ width: '100%' }">
      <Text>onAppear</Text>
      <Spacer />
      <Text data-testid="appear-count" font="headline">{{ appearances }}</Text>
    </HStack>
    <HStack :frame="{ width: '100%' }">
      <Text>onDisappear</Text>
      <Spacer />
      <Text data-testid="disappear-count" font="headline">{{ departures }}</Text>
    </HStack>
  </VStack>
</template>
