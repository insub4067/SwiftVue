import { defineConfig, devices } from '@playwright/test'

// Sandboxes with a pre-provisioned Chromium expose it via this variable; CI
// and dev machines fall back to the browsers `playwright install` manages.
const pinnedChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } }
  : {}

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], ...pinnedChromium },
    },
    {
      // The audience is iOS developers, and every layout bug that cost this
      // project a day was WebKit-only: `fixed` laid out against the large
      // viewport, `dvh` lying during a keyboard animation. Chromium cannot
      // see any of them.
      //
      // Desktop Safari rather than an iPhone descriptor, so the only thing
      // that changes between the two projects is the engine — the specs set
      // their own viewports, and flipping `isMobile`/`hasTouch` as well would
      // make a failure ambiguous. Touch emulation is worth adding next, as
      // its own project.
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run demo:build && npm run demo:preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
