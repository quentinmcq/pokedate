import { defineConfig, devices } from '@playwright/test'

const PORT = 8789
const isCI = !!process.env.CI
const E2E_STATE_DIR = '.wrangler/e2e-state'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'fr-FR',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grepInvert: /@server/ },
  ],
  webServer: {
    // A separate local state keeps test draws out of the database used by the dev server.
    command: `bunx wrangler d1 migrations apply pokedate --local --persist-to ${E2E_STATE_DIR} && bunx wrangler dev --port ${PORT} --ip 127.0.0.1 --persist-to ${E2E_STATE_DIR} --show-interactive-dev-session=false`,
    url: `http://localhost:${PORT}/robots.txt`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
})
