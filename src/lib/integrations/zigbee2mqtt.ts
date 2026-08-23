import WebSocket from 'ws'
import { apiKeyAdapter } from './adapter'
import { UPSTREAM_TIMEOUT_MS } from './types'

export type ZigbeeDevice = {
  friendly_name?: string
  disabled?: boolean
}

type ZigbeeMessage = {
  topic?: string
  payload?: unknown
}

export const ZIGBEE2MQTT_SETTLE_MS = 300

export function websocketUrl(serviceUrl: string, authToken = ''): string {
  const url = new URL(serviceUrl)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  const basePath = url.pathname.replace(/\/$/, '')
  url.pathname = `${basePath}/api`
  url.search = ''
  if (authToken) url.searchParams.set('token', authToken)
  return url.href
}

export function parseAvailabilityTopic(topic: string): string | null {
  const match = topic.match(/^(.+)\/availability$/)
  return match ? match[1] : null
}

export function isOnlineAvailability(payload: unknown): boolean {
  if (typeof payload === 'string') {
    try {
      return isOnlineAvailability(JSON.parse(payload))
    } catch {
      return payload === 'online'
    }
  }

  if (typeof payload === 'object' && payload !== null && 'state' in payload) {
    return (payload as { state: string }).state === 'online'
  }

  return false
}

export function countDeviceAvailability(
  devices: ZigbeeDevice[],
  availabilityByName: Map<string, boolean>,
): { online: number; total: number } {
  const active = devices.filter((device) => !device.disabled)
  let online = 0

  for (const device of active) {
    const name = device.friendly_name
    if (name && availabilityByName.get(name) === true) online += 1
  }

  return { online, total: active.length }
}

export function formatZigbee2MqttGlance(counts: { online: number; total: number }): string {
  return `${counts.online} of ${counts.total} online`
}

function handleMessage(
  message: ZigbeeMessage,
  devices: ZigbeeDevice[],
  availabilityByName: Map<string, boolean>,
) {
  const topic = message.topic ?? ''

  if (topic === 'bridge/devices' && Array.isArray(message.payload)) {
    devices.splice(0, devices.length, ...(message.payload as ZigbeeDevice[]))
    return
  }

  const deviceName = parseAvailabilityTopic(topic)
  if (deviceName !== null) {
    availabilityByName.set(deviceName, isOnlineAvailability(message.payload))
  }
}

export async function collectZigbeeSnapshot(
  serviceUrl: string,
  authToken = '',
  options: {
    WebSocketImpl?: typeof WebSocket
    timeoutMs?: number
    settleMs?: number
  } = {},
): Promise<{ devices: ZigbeeDevice[]; availabilityByName: Map<string, boolean> }> {
  const WebSocketImpl = options.WebSocketImpl ?? WebSocket
  const timeoutMs = options.timeoutMs ?? UPSTREAM_TIMEOUT_MS
  const settleMs = options.settleMs ?? ZIGBEE2MQTT_SETTLE_MS
  const wsUrl = websocketUrl(serviceUrl, authToken)

  return new Promise((resolve, reject) => {
    const devices: ZigbeeDevice[] = []
    const availabilityByName = new Map<string, boolean>()
    let settled = false
    let settleTimer: ReturnType<typeof setTimeout> | null = null

    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      if (timeoutTimer) clearTimeout(timeoutTimer)
      if (settleTimer) clearTimeout(settleTimer)
      ws.close()

      if (error) {
        reject(error)
        return
      }

      resolve({ devices: [...devices], availabilityByName: new Map(availabilityByName) })
    }

    const scheduleFinish = () => {
      if (devices.length === 0) return
      if (settleTimer) clearTimeout(settleTimer)
      settleTimer = setTimeout(() => finish(), settleMs)
    }

    const timeoutTimer = setTimeout(() => {
      if (devices.length === 0) {
        finish(new Error('Zigbee2MQTT snapshot timed out'))
        return
      }
      finish()
    }, timeoutMs)

    const ws = new WebSocketImpl(wsUrl, { rejectUnauthorized: false })

    ws.on('error', (error: Error) => finish(error))
    ws.on('message', (data: WebSocket.RawData) => {
      try {
        handleMessage(JSON.parse(data.toString()) as ZigbeeMessage, devices, availabilityByName)
        scheduleFinish()
      } catch {
        // ignore malformed frames
      }
    })
  })
}

export async function fetchZigbee2MqttGlance(
  serviceUrl: string,
  apiKey: string,
  _fetchImpl: typeof fetch = fetch,
  collect: typeof collectZigbeeSnapshot = collectZigbeeSnapshot,
): Promise<string> {
  const snapshot = await collect(serviceUrl, apiKey)
  return formatZigbee2MqttGlance(
    countDeviceAvailability(snapshot.devices, snapshot.availabilityByName),
  )
}

export const zigbee2mqttAdapter = apiKeyAdapter('zigbee2mqtt', fetchZigbee2MqttGlance)
