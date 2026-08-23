import { LIVE_COALESCE_MS } from './types'

function apiBase(serviceUrl: string): string {
  return serviceUrl.replace(/\/$/, '')
}

function cgiBase(serviceUrl: string): string {
  return `${apiBase(serviceUrl)}/cgi-bin`
}

export function authLoginUrl(serviceUrl: string): string {
  return `${cgiBase(serviceUrl)}/authLogin.cgi`
}

export function sysinfoUrl(serviceUrl: string, sid: string): string {
  const params = new URLSearchParams({
    subfunc: 'sysinfo',
    hd: 'no',
    multicpu: '1',
    sid,
  })
  return `${cgiBase(serviceUrl)}/management/manaRequest.cgi?${params}`
}

export function encodeQnapPassword(password: string): string {
  return Buffer.from(password, 'utf8').toString('base64')
}

export function readXmlTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
  return match?.[1] ?? null
}

export function parseCpuUsage(raw: string | null): number | null {
  if (raw == null || raw.trim() === '') return null
  const value = Number.parseFloat(raw.replace('%', '').trim())
  return Number.isNaN(value) ? null : value
}

export function parseMemoryUsagePercent(totalRaw: string | null, freeRaw: string | null): number | null {
  const total = totalRaw != null ? Number.parseFloat(totalRaw) : Number.NaN
  const free = freeRaw != null ? Number.parseFloat(freeRaw) : Number.NaN
  if (Number.isNaN(total) || total <= 0 || Number.isNaN(free)) return null
  const used = ((total - free) / total) * 100
  return Math.min(100, Math.max(0, used))
}

export function formatQnapGlance(cpuPercent: number | null, memPercent: number | null): string {
  const cpu = cpuPercent != null ? `${Math.round(cpuPercent)}% CPU` : '—% CPU'
  const mem = memPercent != null ? `${Math.round(memPercent)}% RAM` : '—% RAM'
  return `${cpu} · ${mem}`
}

type SessionEntry = {
  sid: string
  expiresAt: number
}

const sessionCache = new Map<string, SessionEntry>()

export function resetQnapSessionCache(): void {
  sessionCache.clear()
}

function sessionKey(serviceUrl: string, username: string): string {
  return `${apiBase(serviceUrl)}:${username}`
}

function readCachedSid(serviceUrl: string, username: string, now: number): string | null {
  const cached = sessionCache.get(sessionKey(serviceUrl, username))
  if (!cached || cached.expiresAt <= now) return null
  return cached.sid
}

function cacheSid(serviceUrl: string, username: string, sid: string, now: number): void {
  sessionCache.set(sessionKey(serviceUrl, username), {
    sid,
    expiresAt: now + LIVE_COALESCE_MS,
  })
}

function parseAuthSid(xml: string): string | null {
  if (readXmlTag(xml, 'authPassed') === '0') return null
  return readXmlTag(xml, 'authSid')
}

async function loginWithPost(
  serviceUrl: string,
  username: string,
  encodedPassword: string,
  fetchImpl: typeof fetch,
): Promise<string | null> {
  const response = await fetchImpl(authLoginUrl(serviceUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ user: username, pwd: encodedPassword }),
  })

  if (!response.ok) {
    throw new Error(`QNAP login failed: ${response.status}`)
  }

  return parseAuthSid(await response.text())
}

async function loginWithGet(
  serviceUrl: string,
  username: string,
  encodedPassword: string,
  fetchImpl: typeof fetch,
): Promise<string | null> {
  const params = new URLSearchParams({ user: username, pwd: encodedPassword })
  const response = await fetchImpl(`${authLoginUrl(serviceUrl)}?${params}`)

  if (!response.ok) {
    throw new Error(`QNAP login failed: ${response.status}`)
  }

  return parseAuthSid(await response.text())
}

export async function fetchQnapSid(
  serviceUrl: string,
  username: string,
  password: string,
  fetchImpl: typeof fetch = fetch,
  now = Date.now(),
): Promise<string> {
  const cached = readCachedSid(serviceUrl, username, now)
  if (cached) return cached

  const encodedPassword = encodeQnapPassword(password)
  const sid =
    (await loginWithPost(serviceUrl, username, encodedPassword, fetchImpl)) ??
    (await loginWithGet(serviceUrl, username, encodedPassword, fetchImpl))

  if (!sid) {
    throw new Error('QNAP login failed: invalid credentials or 2FA enabled')
  }

  cacheSid(serviceUrl, username, sid, now)
  return sid
}

export async function fetchQnapGlance(
  serviceUrl: string,
  username: string,
  password: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const sid = await fetchQnapSid(serviceUrl, username, password, fetchImpl)
  const response = await fetchImpl(sysinfoUrl(serviceUrl, sid))

  if (!response.ok) {
    throw new Error(`QNAP sysinfo failed: ${response.status}`)
  }

  const xml = await response.text()
  const cpu = parseCpuUsage(readXmlTag(xml, 'cpu_usage'))
  const mem = parseMemoryUsagePercent(readXmlTag(xml, 'total_memory'), readXmlTag(xml, 'free_memory'))
  return formatQnapGlance(cpu, mem)
}
