import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

const buildTime = new Date().toISOString().slice(0, 16).replace('T', ' ') + 'Z'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': resolve(__dirname, '../src') },
  },
  root: __dirname,
  base: process.env.GITHUB_ACTIONS ? '/SwiftVue/' : '/',
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
})
