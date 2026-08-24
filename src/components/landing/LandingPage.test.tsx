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

  it('opens a draft catalog service and only persists on Save', async () => {
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
    expect(screen.getByRole('heading', { name: 'Add Sonarr' })).toBeTruthy()

    const putsBeforeSave = fetchMock.mock.calls.filter(
      ([url, init]) => url === '/api/config' && (init as RequestInit | undefined)?.method === 'PUT',
    )
    expect(putsBeforeSave).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('heading', { name: 'Add Sonarr' })).toBeNull()
    expect(screen.queryByText('Sonarr')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Add service' }))
    fireEvent.click(screen.getByRole('button', { name: /^Sonarr/i }))
    await waitFor(() => expect(screen.getByDisplayValue('http://{host}:8989')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      const configPut = fetchMock.mock.calls.find(
        ([url, init]) => url === '/api/config' && (init as RequestInit | undefined)?.method === 'PUT',
      )
      expect(configPut).toBeTruthy()
      const saved = JSON.parse(String((configPut?.[1] as RequestInit).body))
      expect(saved.services).toHaveLength(1)
      expect(saved.services[0].catalogId).toBe('sonarr')
    })
  })

  it('shows a trash control in edit mode and deletes after confirmation', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/live') {
        return { ok: true, json: async () => ({ services: {} }) }
      }
      return { ok: true }
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<LandingPage config={config} catalog={catalog} />)

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete Router' }))

    expect(screen.getByText('Remove service?')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText('Remove service?')).toBeNull()
    expect(screen.getByText('Router')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Delete Router' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

    await waitFor(() => expect(screen.queryByText('Router')).toBeNull())

    const configPut = fetchMock.mock.calls.find(
      ([url, init]) => url === '/api/config' && (init as RequestInit | undefined)?.method === 'PUT',
    )
    expect(configPut).toBeTruthy()
    const saved = JSON.parse(String((configPut?.[1] as RequestInit).body))
    expect(saved.services.some((service: { id: string }) => service.id === 'svc-infra')).toBe(false)
  })

  it('exports the current config as a downloadable JSON file', () => {
    const createObjectURL = vi.fn(() => 'blob:wilab-config')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    render(<LandingPage config={config} catalog={catalog} />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Export config' }))

    expect(createObjectURL).toHaveBeenCalled()
    const blob = createObjectURL.mock.calls[0]?.[0] as Blob
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('application/json')
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:wilab-config')

    clickSpy.mockRestore()
  })

  it('imports a valid config after confirmation and rejects bad JSON', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/live') {
        return { ok: true, json: async () => ({ services: {} }) }
      }
      return { ok: true }
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<LandingPage config={config} catalog={catalog} />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))

    const fileInput = screen.getByLabelText('Import config file')
    const badFile = new File(['{nope'], 'bad.json', { type: 'application/json' })
    fireEvent.change(fileInput, { target: { files: [badFile] } })

    await waitFor(() =>
      expect(screen.getByText('Invalid JSON — could not parse the file.')).toBeTruthy(),
    )

    const goodPayload = {
      schemaVersion: 1,
      services: [
        {
          id: 'imported-only',
          catalogId: null,
          name: 'Imported Only',
          url: 'http://imported',
          logo: '',
          tags: [],
          integration: null,
        },
      ],
      gridOrder: ['imported-only'],
      pinnedOrder: [],
      searchProviders: DEFAULT_SEARCH_PROVIDERS.map((provider) => ({ ...provider })),
      activeSearchProviderId: 'ddg',
    }
    const goodFile = new File([JSON.stringify(goodPayload)], 'good.json', {
      type: 'application/json',
    })
    fireEvent.change(fileInput, { target: { files: [goodFile] } })

    await waitFor(() => expect(screen.getByText('Import config?')).toBeTruthy())
    expect(screen.getByText(/1 service/)).toBeTruthy()
    expect(screen.getByText(/contain secrets/i)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Replace config' }))

    await waitFor(() => expect(screen.getByText('Imported Only')).toBeTruthy())
    expect(screen.queryByText('Home Assistant')).toBeNull()

    const configPut = fetchMock.mock.calls.find(
      ([url, init]) => url === '/api/config' && (init as RequestInit | undefined)?.method === 'PUT',
    )
    expect(configPut).toBeTruthy()
    const saved = JSON.parse(String((configPut?.[1] as RequestInit).body))
    expect(saved.services).toHaveLength(1)
    expect(saved.services[0].id).toBe('imported-only')
  })
})
