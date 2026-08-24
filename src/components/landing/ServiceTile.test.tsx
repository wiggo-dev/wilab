/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ServiceTile } from './ServiceTile'

const service = {
  id: 'svc-1',
  catalogId: null,
  name: 'Probe',
  url: 'http://probe.lab',
  logo: '',
  tags: [],
  integration: null,
}

describe('ServiceTile glance attention', () => {
  afterEach(() => {
    cleanup()
  })

  it('marks unhealthy healthy glances as warn on badge and tile', () => {
    render(
      <ServiceTile
        service={service}
        zone="grid"
        activeTag={null}
        onTagClick={() => {}}
        glance={{ status: 'healthy', text: '2 unhealthy' }}
      />,
    )

    expect(screen.getByText('2 unhealthy').getAttribute('data-attention')).toBe('warn')
    expect(screen.getByText('2 unhealthy').closest('[data-attention-tile]')?.getAttribute('data-attention-tile')).toBe(
      'warn',
    )
  })

  it('marks unavailable glances as error', () => {
    render(
      <ServiceTile
        service={service}
        zone="pinned"
        activeTag={null}
        onTagClick={() => {}}
        glance={{ status: 'unavailable', text: 'Unavailable' }}
      />,
    )

    expect(screen.getByText('Unavailable').getAttribute('data-attention')).toBe('error')
    expect(
      screen.getByText('Unavailable').closest('[data-attention-tile]')?.getAttribute('data-attention-tile'),
    ).toBe('error')
  })

  it('keeps healthy ok glances as ok', () => {
    render(
      <ServiceTile
        service={service}
        zone="grid"
        activeTag={null}
        onTagClick={() => {}}
        glance={{ status: 'healthy', text: '2/2 up' }}
      />,
    )

    expect(screen.getByText('2/2 up').getAttribute('data-attention')).toBe('ok')
  })
})
