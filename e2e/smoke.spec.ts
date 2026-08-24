import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { seedConfig } from './helpers'

test.describe('wilab smoke', () => {
  test.beforeEach(async ({ request }) => {
    await seedConfig(request)
  })

  test('loads the dashboard with seeded services', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('banner')).toContainText('wilab')
    await expect(page.getByText('Home Assistant').first()).toBeVisible()
    await expect(page.getByText('Jellyfin').first()).toBeVisible()
    await expect(page.getByText('Router')).toBeVisible()
  })

  test('adds a service from the catalog', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.getByRole('button', { name: 'Add service' }).click()
    await page.getByRole('button', { name: 'Plex' }).click()

    await expect(page.getByRole('heading', { name: 'Add Plex' })).toBeVisible()
    await page.getByRole('textbox', { name: 'URL', exact: true }).fill('http://plex.lab.lan:32400/web')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByRole('heading', { name: 'Add Plex' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Edit Plex' })).toBeVisible()
  })

  test('discards a catalog pick when the dialog is closed without saving', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.getByRole('button', { name: 'Add service' }).click()
    await page.getByRole('button', { name: 'Plex' }).click()

    await expect(page.getByRole('heading', { name: 'Add Plex' })).toBeVisible()
    await page.keyboard.press('Escape')

    await expect(page.getByRole('heading', { name: 'Add Plex' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Edit Plex' })).toHaveCount(0)
  })

  test('edits a service from the tile wall', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.getByRole('button', { name: 'Edit Router' }).click()

    await expect(page.getByRole('heading', { name: 'Edit Router' })).toBeVisible()
    await page.getByLabel('Name').fill('Gateway')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByRole('heading', { name: 'Edit Gateway' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Edit Gateway' })).toBeVisible()
    await expect(page.getByText('Router')).toHaveCount(0)
  })

  test('enables HTTP health check on a custom service', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.getByRole('button', { name: 'Edit Router' }).click()

    await expect(page.getByRole('heading', { name: 'Edit Router' })).toBeVisible()
    await page.getByLabel('HTTP health check').check()
    await page.getByLabel('Health path (optional)').fill('/health')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByRole('heading', { name: 'Edit Router' })).toBeHidden()

    await page.getByRole('button', { name: 'Edit Router' }).click()
    await expect(page.getByLabel('HTTP health check')).toBeChecked()
    await expect(page.getByLabel('Health path (optional)')).toHaveValue('/health')
  })

  test('exports and imports config from edit mode', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Edit' }).click()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export config' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('wilab-config.json')
    const downloadPath = await download.path()
    expect(downloadPath).toBeTruthy()
    const exported = await readFile(downloadPath!, 'utf8')
    const parsed = JSON.parse(exported)
    expect(parsed.schemaVersion).toBe(1)
    expect(parsed.services.length).toBeGreaterThan(0)

    const importedOnly = {
      schemaVersion: 1,
      services: [
        {
          id: 'imported-only',
          catalogId: null,
          name: 'Imported Only',
          url: 'http://imported.lab',
          logo: '',
          tags: [],
          integration: null,
        },
      ],
      gridOrder: ['imported-only'],
      pinnedOrder: [],
      searchProviders: parsed.searchProviders,
      activeSearchProviderId: parsed.activeSearchProviderId,
    }

    await page.getByLabel('Import config file').setInputFiles({
      name: 'import.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(importedOnly)),
    })

    await expect(page.getByRole('heading', { name: 'Import config?' })).toBeVisible()
    await expect(page.getByText(/1 service/)).toBeVisible()
    await expect(page.getByText(/contain secrets/i)).toBeVisible()
    await page.getByRole('button', { name: 'Replace config' }).click()

    await expect(page.getByText('Imported Only')).toBeVisible()
    await expect(page.getByText('Home Assistant')).toHaveCount(0)
  })

  test('submits header search to the active provider', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Search query').fill('homelab dashboard')

    const popup = page.waitForEvent('popup')
    await page.getByLabel('Search query').press('Enter')
    const searchPage = await popup

    await expect(searchPage).toHaveURL(/duckduckgo\.com\/\?q=homelab\+dashboard/)
  })
})
