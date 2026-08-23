import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  containersUrl,
  countDockerContainers,
  endpointsUrl,
  fetchPortainerGlance,
  formatPortainerGlance,
  sumPortainerSnapshots,
} from './portainer'

describe('portainer integration', () => {
  it('builds the endpoints url from a service base url', () => {
    expect(endpointsUrl('https://portainer.lab:9443')).toBe(
      'https://portainer.lab:9443/api/endpoints',
    )
    expect(endpointsUrl('https://portainer.lab:9443/')).toBe(
      'https://portainer.lab:9443/api/endpoints',
    )
  })

  it('sums snapshot counts across environments', () => {
    const endpoints = [
      {
        Snapshots: [
          { RunningContainerCount: 22, ContainerCount: 24, UnhealthyContainerCount: 0 },
        ],
      },
      {
        Snapshots: [
          { RunningContainerCount: 8, ContainerCount: 10, UnhealthyContainerCount: 1 },
        ],
      },
    ]

    expect(sumPortainerSnapshots(endpoints)).toEqual({
      running: 30,
      total: 34,
      unhealthy: 1,
    })
  })

  it('uses the latest snapshot when multiple exist', () => {
    const endpoints = [
      {
        Snapshots: [
          { RunningContainerCount: 1, ContainerCount: 2, UnhealthyContainerCount: 0 },
          { RunningContainerCount: 5, ContainerCount: 6, UnhealthyContainerCount: 0 },
        ],
      },
    ]

    expect(sumPortainerSnapshots(endpoints)).toEqual({
      running: 5,
      total: 6,
      unhealthy: 0,
    })
  })

  it('formats unhealthy-first badge strings', () => {
    expect(formatPortainerGlance({ running: 30, total: 34, unhealthy: 0 })).toBe(
      '30/34 running',
    )
    expect(formatPortainerGlance({ running: 30, total: 34, unhealthy: 2 })).toBe('2 unhealthy')
  })

  it('handles empty endpoints and missing snapshots', () => {
    expect(sumPortainerSnapshots([])).toEqual({ running: 0, total: 0, unhealthy: 0 })
    expect(sumPortainerSnapshots([{ Snapshots: [] }])).toEqual({
      running: 0,
      total: 0,
      unhealthy: 0,
    })
    expect(formatPortainerGlance({ running: 0, total: 0, unhealthy: 0 })).toBe('0/0 running')
  })

  it('counts running and unhealthy containers from docker proxy responses', () => {
    expect(
      countDockerContainers([
        { State: 'running' },
        { State: 'running', Health: { Status: 'unhealthy' } },
        { State: 'exited' },
      ]),
    ).toEqual({ running: 2, total: 3, unhealthy: 1 })
  })

  it('builds the containers url for an environment id', () => {
    expect(containersUrl('https://portainer.lab:9443', 3)).toBe(
      'https://portainer.lab:9443/api/endpoints/3/docker/containers/json?all=true',
    )
  })

  describe('fetchPortainerGlance', () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
      fetchMock.mockReset()
      vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('fetches endpoints with api key and formats the badge', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => [
          {
            Snapshots: [
              { RunningContainerCount: 10, ContainerCount: 12, UnhealthyContainerCount: 0 },
            ],
          },
        ],
      })

      const text = await fetchPortainerGlance('https://portainer.lab:9443', 'ptr_token')

      expect(fetchMock).toHaveBeenCalledWith(
        'https://portainer.lab:9443/api/endpoints',
        expect.objectContaining({
          headers: { 'X-API-Key': 'ptr_token' },
        }),
      )
      expect(text).toBe('10/12 running')
    })

    it('falls back to docker containers when snapshots are empty', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url.endsWith('/api/endpoints')) {
          return {
            ok: true,
            json: async () => [{ Id: 1, Snapshots: [] }],
          }
        }

        return {
          ok: true,
          json: async () => [
            { State: 'running' },
            { State: 'running' },
            { State: 'exited', Health: { Status: 'unhealthy' } },
          ],
        }
      })

      const text = await fetchPortainerGlance('https://portainer.lab:9443', 'ptr_token', fetchMock)

      expect(fetchMock).toHaveBeenCalledWith(
        'https://portainer.lab:9443/api/endpoints/1/docker/containers/json?all=true',
        expect.objectContaining({
          headers: { 'X-API-Key': 'ptr_token' },
        }),
      )
      expect(text).toBe('1 unhealthy')
    })
  })
})
