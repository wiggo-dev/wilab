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

    await expect(page.getByRole('heading', { name: 'Edit Plex' })).toBeVisible()
    await page.getByRole('textbox', { name: 'URL', exact: true }).fill('http://plex.lab.lan:32400/web')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByRole('heading', { name: 'Edit Plex' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Plex' })).toBeVisible()
  })

  test('edits a service from the tile wall', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.getByRole('button', { name: 'Router' }).click()

    await expect(page.getByRole('heading', { name: 'Edit Router' })).toBeVisible()
    await page.getByLabel('Name').fill('Gateway')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByRole('heading', { name: 'Edit Gateway' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Gateway' })).toBeVisible()
    await expect(page.getByText('Router')).toHaveCount(0)
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
