import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

const buildTime = new Date().toISOString().slice(0, 16).replace('T', ' ') + 'Z'

/**
 * Publishes the build stamp next to the bundle so a running page can tell
 * whether it is the current deploy. Hashed assets are safe to cache forever,
 * but a stale index.html pins the page to an old bundle with no way to notice.
 */
function emitVersionFile(): Plugin {
  return {
    name: 'emit-version-file',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ buildTime }),
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), emitVersionFile()],
  resolve: {
    alias: { '@': resolve(__dirname, '../src') },
  },
  root: __dirname,
  base: process.env.GITHUB_ACTIONS ? '/SwiftVue/' : '/',
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
})
