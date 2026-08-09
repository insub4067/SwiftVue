<script setup lang="ts">
import { computed, ref } from 'vue'

const REPO = 'https://github.com/insub4067/SwiftVue/blob/main'

interface Props {
  /** the snippet shown for this demo */
  code: string
  /** repo-relative paths this demo is built from, e.g. src/components/data/Section.vue */
  sources?: string[]
}

const props = withDefaults(defineProps<Props>(), { sources: () => [] })

const copied = ref(false)
const trimmed = computed(() => props.code.replace(/^\n+|\n+$/g, ''))

async function copy() {
  try {
    await navigator.clipboard.writeText(trimmed.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1600)
  } catch {
    // clipboard blocked (insecure context, denied permission) — leave the label alone
  }
}

function fileName(path: string) {
  return path.split('/').pop() ?? path
}
</script>

<template>
  <Section collapsible :default-expanded="false" header="Source">
    <div class="code-body">
      <div class="code-head">
        <Text font="caption2" foreground-color="secondary">Usage</Text>
        <button type="button" class="code-copy" @click="copy">
          {{ copied ? 'Copied' : 'Copy' }}
        </button>
      </div>
      <pre class="code-block"><code>{{ trimmed }}</code></pre>

      <div v-if="sources.length" class="code-links">
        <Text font="caption2" foreground-color="secondary">Implementation</Text>
        <a
          v-for="path in sources"
          :key="path"
          class="code-link"
          :href="`${REPO}/${path}`"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span class="code-link-name">{{ fileName(path) }}</span>
          <span class="code-link-path">{{ path }}</span>
          <span class="code-link-icon" aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  </Section>
</template>

<style scoped>
.code-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px 14px;
}
.code-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.code-copy {
  border: 1px solid var(--swift-separator);
  background: none;
  border-radius: 7px;
  padding: 3px 10px;
  font-family: inherit;
  font-size: 12px;
  color: var(--swift-primary);
  cursor: pointer;
}
.code-copy:focus-visible {
  outline: 2px solid var(--swift-primary);
  outline-offset: 2px;
}

.code-block {
  margin: 0;
  padding: 12px;
  border-radius: 8px;
  background: var(--swift-fill);
  /* long lines scroll here rather than widening the screen — docs/LAYOUT.md */
  overflow-x: auto;
  font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.55;
  color: var(--swift-label);
  -webkit-text-size-adjust: 100%;
}
.code-block code { white-space: pre; }

.code-links {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.code-link {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--swift-fill);
  text-decoration: none;
  color: var(--swift-primary);
  font-size: 14px;
}
.code-link:focus-visible {
  outline: 2px solid var(--swift-primary);
  outline-offset: 2px;
}
.code-link-name { font-weight: 600; flex-shrink: 0; }
.code-link-path {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  color: var(--swift-secondary-label);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  direction: rtl; /* keep the filename end visible when truncated */
  text-align: left;
}
.code-link-icon { flex-shrink: 0; font-size: 12px; }
</style>
