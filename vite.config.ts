import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({ include: ['src'] }),
  ],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SwiftVue',
      formats: ['es', 'umd'],
      fileName: 'swiftvue',
    },
    rollupOptions: {
      external: ['vue', 'vue-router'],
      output: {
        globals: { vue: 'Vue', 'vue-router': 'VueRouter' },
      },
    },
  },
})
