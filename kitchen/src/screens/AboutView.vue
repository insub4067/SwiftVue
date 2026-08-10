<script setup lang="ts">
import { computed } from 'vue'
import { ScrollView, Section, VStack, HStack, Spacer, Text, Gauge, ProgressView } from '@swiftvue'
import { todos, openTodos } from '../store'

const done = computed(() => todos.value.length - openTodos.value.length)
const share = computed(() => (todos.value.length ? done.value / todos.value.length : 0))

/** localStorage is measured in characters, near enough for a demo. */
const stored = computed(() => JSON.stringify(todos.value).length)
</script>

<template>
  <ScrollView>
    <VStack :spacing="16" :padding="[8, 0, 24]">
      <Section header="Progress">
        <VStack :spacing="16" :padding="[16, 16]" alignment="center">
          <Gauge
            :value="share"
            :min="0"
            :max="1"
            gauge-style="circular"
            :current-value-label="`${Math.round(share * 100)}%`"
            label="Completed"
          />
          <ProgressView
            :value="done"
            :total="Math.max(todos.length, 1)"
            progress-view-style="linear"
            label="Completed todos"
          />
          <Text font="footnote" foreground-color="secondaryLabel">
            {{ done }} of {{ todos.length }} done
          </Text>
        </VStack>
      </Section>

      <Section header="Storage">
        <HStack :padding="[11, 16]">
          <Text>localStorage</Text>
          <Spacer />
          <Text foreground-color="secondaryLabel">{{ stored }} characters</Text>
        </HStack>
      </Section>

      <Section header="About" footer="Kitchen is the app SwiftVue is tested against.">
        <HStack :padding="[11, 16]">
          <Text>Library</Text>
          <Spacer />
          <Text foreground-color="secondaryLabel">SwiftVue</Text>
        </HStack>
        <HStack :padding="[11, 16]">
          <Text>Source</Text>
          <Spacer />
          <a class="link" href="https://github.com/insub4067/SwiftVue">github.com/insub4067/SwiftVue</a>
        </HStack>
      </Section>
    </VStack>
  </ScrollView>
</template>

<style scoped>
.link {
  color: var(--swift-blue);
  text-decoration: none;
}
.link:hover { text-decoration: underline; }
</style>
