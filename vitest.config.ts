import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // `@swiftvue` mirrors what Kitchen's own vite config does, so its
    // screens can be mounted here exactly as they are built.
    alias: [
      { find: /^@swiftvue\/styles$/, replacement: resolve(__dirname, 'src/styles/swift.css') },
      { find: /^@swiftvue$/, replacement: resolve(__dirname, 'src/index.ts') },
      { find: /^@\//, replacement: `${resolve(__dirname, 'src')}/` },
    ],
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/env.d.ts', 'src/styles/**'],
    },
  },
})
