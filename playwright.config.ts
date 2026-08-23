import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { defineConfig } from '@playwright/test'

const E2E_PORT = 3001

const dataDir =
  process.env.WILAB_E2E_DATA_DIR ?? mkdtempSync(join(tmpdir(), 'wilab-e2e-'))

process.env.WILAB_E2E_DATA_DIR = dataDir

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${E2E_PORT}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `pnpm dev --hostname 127.0.0.1 --port ${E2E_PORT}`,
    url: `http://127.0.0.1:${E2E_PORT}`,
    // Never reuse an existing server — e2e seeds config via PUT and must use WILAB_DATA_DIR above.
    reuseExistingServer: false,
    env: {
      ...process.env,
      WILAB_DATA_DIR: dataDir,
    },
  },
})
