<script setup lang="ts">
import {
  NavigationStack, NavigationLink, ScrollView, Section, VStack, HStack,
  Spacer, Text, Label, Toggle, Stepper, Picker, Button, Alert, useState,
} from '@swiftvue'
import { settings, todos, openTodos, restoreSeed, PRIORITIES } from '../store'
import FormRow from '../components/FormRow.vue'
import AppearanceView from './AppearanceView.vue'
import AboutView from './AboutView.vue'

const confirmingReset = useState(false)

const DIRECTIONS = [
  { label: 'Automatic', value: 'auto' },
  { label: 'Left to right', value: 'ltr' },
  { label: 'Right to left', value: 'rtl' },
]

function onReset(label: string) {
  if (label !== 'Reset') return
  settings.hideCompleted.value = false
  settings.defaultPriority.value = 'normal'
  settings.reminderLeadDays.value = 2
  settings.direction.value = 'auto'
  settings.confirmDelete.value = true
  restoreSeed()
}
</script>

<template>
  <!--
    No `browser-back` here. The browser's history is one list, and the todos
    stack already answers it; a second claimant would pop the wrong screen.
    This stack still has its back button and edge swipe.
  -->
  <NavigationStack title="Settings">
    <ScrollView>
      <VStack :spacing="16" :padding="[8, 0, 24]">
        <Section header="Display">
          <NavigationLink destination-title="Appearance">
            <HStack :padding="[11, 16]" :spacing="12">
              <Label system-image="🌓">Appearance</Label>
              <Spacer />
              <Text foreground-color="secondaryLabel">›</Text>
            </HStack>
            <template #destination>
              <AppearanceView />
            </template>
          </NavigationLink>

          <FormRow title="Hide completed" subtitle="Keeps finished todos out of the list">
            <Toggle v-model="settings.hideCompleted.value" label="Hide completed" />
          </FormRow>
        </Section>

        <Section header="New todos">
          <FormRow title="Default priority">
            <Picker v-model="settings.defaultPriority.value" :options="PRIORITIES" />
          </FormRow>
          <FormRow title="Remind me" :subtitle="`${settings.reminderLeadDays.value} day(s) before it is due`">
            <Stepper v-model="settings.reminderLeadDays.value" :min="0" :max="14" />
          </FormRow>
        </Section>

        <Section header="Language & Region" footer="Right to left mirrors the whole app, swipe gestures included.">
          <FormRow title="Writing direction">
            <Picker v-model="settings.direction.value" :options="DIRECTIONS" />
          </FormRow>
        </Section>

        <Section header="Data">
          <FormRow title="Confirm before deleting">
            <Toggle v-model="settings.confirmDelete.value" label="Confirm before deleting" />
          </FormRow>
          <HStack :padding="[11, 16]">
            <Text foreground-color="secondaryLabel">
              {{ todos.length }} todos, {{ openTodos.length }} still open
            </Text>
          </HStack>
        </Section>

        <Section>
          <NavigationLink destination-title="About">
            <HStack :padding="[11, 16]" :spacing="12">
              <Label system-image="ℹ️">About SwiftVue Kitchen</Label>
              <Spacer />
              <Text foreground-color="secondaryLabel">›</Text>
            </HStack>
            <template #destination>
              <AboutView />
            </template>
          </NavigationLink>
        </Section>

        <VStack :padding="[0, 16]">
          <Button role="destructive" full-width @tap="confirmingReset = true">
            Reset Everything
          </Button>
        </VStack>
      </VStack>
    </ScrollView>

    <Alert
      v-model:is-presented="confirmingReset"
      title="Reset everything?"
      message="Settings go back to their defaults and the example todos come back."
      :actions="[{ label: 'Cancel', role: 'cancel' }, { label: 'Reset', role: 'destructive' }]"
      @action="onReset"
    />
  </NavigationStack>
</template>
