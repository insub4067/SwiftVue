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
      // Desktop Safari rather than an iPhone descriptor, so the engine is
      // near enough the only thing that differs from the chromium project —
      // the specs set their own viewports, and `isMobile` would change
      // layout as well and make a failure ambiguous. `hasTouch` is the one
      // exception: the pull and swipe gestures are touch-driven, and without
      // it they are unreachable rather than merely untested.
      name: 'webkit',
      use: { ...devices['Desktop Safari'], hasTouch: true },
    },
  ],
  // Two apps, two ports. The playground is the component gallery and owns
  // `baseURL`; Kitchen is the small real app the library is regression
  // tested against, and its spec addresses it absolutely.
  webServer: [
    {
      command: 'npm run demo:build && npm run demo:preview',
      port: 4173,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run kitchen:build && npm run kitchen:preview',
      port: 4174,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
