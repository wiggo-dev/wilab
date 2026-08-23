/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LandingPage } from '@/components/landing/LandingPage'
import { resolveConfigForDisplay } from '@/lib/landing/resolve-services'
import { FIXTURE_CONFIG } from '@/lib/landing/fixtures'

describe('LandingPage', () => {
  const config = resolveConfigForDisplay(FIXTURE_CONFIG)
  const openSpy = vi.fn()

  afterEach(() => {
    cleanup()
    openSpy.mockReset()
    vi.unstubAllGlobals()
  })

  it('renders services from seeded config', () => {
    render(<LandingPage config={config} />)

    expect(screen.getByText('wilab')).toBeTruthy()
    expect(screen.getAllByText('Home Assistant').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('link', { name: /Sonarr/i })).toHaveAttribute(
      'href',
      'http://sonarr.lab.lan:8989',
    )
  })

  it('narrows the main grid while pinned services stay visible', () => {
    render(<LandingPage config={config} />)

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

    render(<LandingPage config={config} />)

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
})
