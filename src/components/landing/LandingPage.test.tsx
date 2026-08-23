/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getCatalog } from '@/lib/catalog/catalog'
import { DEFAULT_SEARCH_PROVIDERS } from '@/lib/config/defaults'
import { LandingPage } from '@/components/landing/LandingPage'
import { resolveConfigForDisplay } from '@/lib/landing/resolve-services'
import { FIXTURE_CONFIG } from '@/lib/landing/fixtures'

describe('LandingPage', () => {
  const catalog = getCatalog()
  const config = resolveConfigForDisplay(FIXTURE_CONFIG)
  const openSpy = vi.fn()
  const fetchMock = vi.fn()

  afterEach(() => {
    cleanup()
    openSpy.mockReset()
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('renders services from seeded config', () => {
    render(<LandingPage config={config} catalog={catalog} />)

    expect(screen.getByText('wilab')).toBeTruthy()
    expect(screen.getAllByText('Home Assistant').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('link', { name: /Sonarr/i })).toHaveAttribute(
      'href',
      'http://sonarr.lab.lan:8989',
    )
  })

  it('narrows the main grid while pinned services stay visible', () => {
    render(<LandingPage config={config} catalog={catalog} />)

    const header = screen.getByRole('banner')
    fireEvent.click(within(header).getByRole('button', { name: 'media' }))

    expect(screen.getAllByText('Home Assistant')).toHaveLength(1)
    expect(screen.getAllByText('Jellyfin')).toHaveLength(2)
    expect(screen.getByText('Sonarr')).toBeTruthy()
    expect(screen.getByText('Radarr')).toBeTruthy()
    expect(screen.queryByText('Router')).toBeNull()
  })

  it('submits search to the active provider template', () => {
    vi.stubGlobal('open', openSpy)

    render(<LandingPage config={config} catalog={catalog} />)

    fireEvent.change(screen.getByLabelText('Search query'), {
      target: { value: 'homelab dashboards' },
    })
    fireEvent.submit(screen.getByLabelText('Search query').closest('form')!)

    expect(openSpy).toHaveBeenCalledWith(
      'https://duckduckgo.com/?q=homelab%20dashboards',
      '_blank',
      'noopener',
    )
  })

  it('adds from catalog and opens the edit dialog with defaults', async () => {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url === '/api/live') {
        return { ok: true, json: async () => ({ services: {} }) }
      }
      return { ok: true }
    })
    vi.stubGlobal('fetch', fetchMock)

    const emptyConfig = resolveConfigForDisplay({
      schemaVersion: 1,
      services: [],
      gridOrder: [],
      pinnedOrder: [],
      searchProviders: DEFAULT_SEARCH_PROVIDERS.map((provider) => ({ ...provider })),
      activeSearchProviderId: 'ddg',
    })

    render(<LandingPage config={emptyConfig} catalog={catalog} />)

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add service' }))
    fireEvent.click(screen.getByRole('button', { name: /^Sonarr/i }))

    await waitFor(() => expect(screen.getByDisplayValue('http://{host}:8989')).toBeTruthy())

    const configPut = fetchMock.mock.calls.find(
      ([url, init]) => url === '/api/config' && (init as RequestInit | undefined)?.method === 'PUT',
    )
    expect(configPut).toBeTruthy()
    const saved = JSON.parse(String((configPut?.[1] as RequestInit).body))
    expect(saved.services).toHaveLength(1)
    expect(saved.services[0].catalogId).toBe('sonarr')
  })
})
