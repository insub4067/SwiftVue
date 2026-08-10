import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // Kitchen imports the library the way an app does — by name, never by
    // relative path into its internals. The alias points at the working
    // tree rather than the published package on purpose: this app is the
    // regression suite, so it has to fail on a change that has not shipped
    // yet. The published package is verified separately, by
    // `scripts/verify-package.mjs`, which builds its own consumer.
    //
    // Ordered, so the exact `@swiftvue/styles` match wins before the bare
    // one — the two mirror `swiftvue` and `swiftvue/styles`, which is what
    // a real app writes.
    alias: [
      { find: /^@swiftvue\/styles$/, replacement: resolve(__dirname, '../src/styles/swift.css') },
      { find: /^@swiftvue$/, replacement: resolve(__dirname, '../src/index.ts') },
    ],
  },
  root: __dirname,
  base: process.env.GITHUB_ACTIONS ? '/SwiftVue/kitchen/' : '/',
  build: { outDir: 'dist' },
})
