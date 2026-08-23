import { EventEmitter } from 'node:events'
import { describe, expect, it, vi } from 'vitest'
import WebSocket from 'ws'
import {
  collectZigbeeSnapshot,
  countDeviceAvailability,
  fetchZigbee2MqttGlance,
  formatZigbee2MqttGlance,
  isOnlineAvailability,
  parseAvailabilityTopic,
  websocketUrl,
} from './zigbee2mqtt'

describe('zigbee2mqtt integration', () => {
  it('builds the websocket url from a service base url', () => {
    expect(websocketUrl('http://zigbee2mqtt.lab:8080')).toBe('ws://zigbee2mqtt.lab:8080/api')
    expect(websocketUrl('https://zigbee2mqtt.lab:8080/')).toBe('wss://zigbee2mqtt.lab:8080/api')
    expect(websocketUrl('http://host/zigbee2mqtt', 'secret')).toBe(
      'ws://host/zigbee2mqtt/api?token=secret',
    )
  })

  it('parses availability topics and payloads', () => {
    expect(parseAvailabilityTopic('kitchen_light/availability')).toBe('kitchen_light')
    expect(parseAvailabilityTopic('bridge/devices')).toBeNull()
    expect(isOnlineAvailability({ state: 'online' })).toBe(true)
    expect(isOnlineAvailability({ state: 'offline' })).toBe(false)
    expect(isOnlineAvailability('{"state":"online"}')).toBe(true)
  })

  it('counts online devices among non-disabled devices', () => {
    const devices = [
      { friendly_name: 'a', disabled: false },
      { friendly_name: 'b', disabled: false },
      { friendly_name: 'c', disabled: true },
      { friendly_name: 'd', disabled: false },
    ]
    const availability = new Map([
      ['a', true],
      ['b', false],
      ['d', true],
    ])

    expect(countDeviceAvailability(devices, availability)).toEqual({ online: 2, total: 3 })
    expect(formatZigbee2MqttGlance({ online: 2, total: 3 })).toBe('2 of 3 online')
    expect(formatZigbee2MqttGlance({ online: 0, total: 0 })).toBe('0 of 0 online')
  })

  it('collects devices and availability from websocket messages', async () => {
    class MockWebSocket extends EventEmitter {
      static lastUrl: string | undefined

      constructor(url: string) {
        super()
        MockWebSocket.lastUrl = url
        queueMicrotask(() => {
          this.emit('message', JSON.stringify({
            topic: 'bridge/devices',
            payload: [
              { friendly_name: 'kitchen', disabled: false },
              { friendly_name: 'bedroom', disabled: false },
              { friendly_name: 'spare', disabled: true },
            ],
          }))
          this.emit('message', JSON.stringify({
            topic: 'kitchen/availability',
            payload: { state: 'online' },
          }))
          this.emit('message', JSON.stringify({
            topic: 'bedroom/availability',
            payload: { state: 'offline' },
          }))
        })
      }

      close = vi.fn()
    }

    const snapshot = await collectZigbeeSnapshot('http://zigbee2mqtt.lab:8080', 'z2m_token', {
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
      timeoutMs: 1000,
      settleMs: 10,
    })

    expect(MockWebSocket.lastUrl).toBe('ws://zigbee2mqtt.lab:8080/api?token=z2m_token')
    expect(snapshot.devices).toHaveLength(3)
    expect(countDeviceAvailability(snapshot.devices, snapshot.availabilityByName)).toEqual({
      online: 1,
      total: 2,
    })
  })

  it('fetchZigbee2MqttGlance formats the badge from a websocket snapshot', async () => {
    const collect = vi.fn().mockResolvedValue({
      devices: [{ friendly_name: 'a' }, { friendly_name: 'b' }],
      availabilityByName: new Map([
        ['a', true],
        ['b', true],
      ]),
    })

    const text = await fetchZigbee2MqttGlance(
      'http://zigbee2mqtt.lab:8080',
      'token',
      fetch,
      collect,
    )

    expect(collect).toHaveBeenCalledWith('http://zigbee2mqtt.lab:8080', 'token')
    expect(text).toBe('2 of 2 online')
  })
})
