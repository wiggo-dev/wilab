import { upstreamFetch } from '@/lib/integrations/upstream-fetch'
import { UPSTREAM_TIMEOUT_MS } from '@/lib/integrations/types'
import { withUpstreamTimeout } from '@/lib/integrations/upstream-timeout'

export const MAX_FAVICON_HTML_BYTES = 256 * 1024

export type FaviconResolveResult =
  | { ok: true; logo: string }
  | { ok: false; error: string }

export function parseServiceUrl(url: string): URL | null {
  try {
    const parsed = new URL(url.trim())
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    if (!parsed.hostname) return null
    return parsed
  } catch {
    return null
  }
}

export function findIconHref(html: string): string | null {
  const linkRegex = /<link\b[^>]*>/gi
  let shortcut: string | null = null

  for (const match of html.matchAll(linkRegex)) {
    const tag = match[0]
    const relMatch = tag.match(/\brel=["']([^"']+)["']/i)
    if (!relMatch) continue

    const relTokens = relMatch[1].toLowerCase().split(/\s+/)
    if (relTokens.includes('apple-touch-icon')) continue

    const isIcon = relTokens.includes('icon') || relTokens.join(' ') === 'shortcut icon'
    if (!isIcon) continue

    const hrefMatch = tag.match(/\bhref=["']([^"']+)["']/i)
    if (!hrefMatch) continue

    if (relTokens.includes('shortcut')) {
      shortcut ??= hrefMatch[1]
      continue
    }

    return hrefMatch[1]
  }

  return shortcut
}

export function resolveIconUrl(pageUrl: URL, href: string): string {
  if (href.startsWith('data:')) return href
  return new URL(href, pageUrl).href
}

async function fetchText(
  url: string,
  fetchImpl: typeof fetch,
  maxBytes: number,
): Promise<string | null> {
  const response = await fetchImpl(url, {
    headers: { Accept: 'text/html,application/xhtml+xml' },
  })
  if (!response.ok) return null
  const text = await response.text()
  return text.slice(0, maxBytes)
}

async function faviconExists(url: string, fetchImpl: typeof fetch): Promise<boolean> {
  const response = await fetchImpl(url, { method: 'HEAD' })
  if (response.ok) return true
  if (response.status === 405 || response.status === 501) {
    const getResponse = await fetchImpl(url, { method: 'GET' })
    return getResponse.ok
  }
  return false
}

export async function resolveFavicon(
  serviceUrl: string,
  fetchImpl: typeof fetch = upstreamFetch,
): Promise<FaviconResolveResult> {
  const parsed = parseServiceUrl(serviceUrl)
  if (!parsed) {
    return { ok: false, error: 'Enter a valid http or https URL first.' }
  }

  try {
    const html = await withUpstreamTimeout(
      fetchText(parsed.href, fetchImpl, MAX_FAVICON_HTML_BYTES),
      UPSTREAM_TIMEOUT_MS,
      'Favicon fetch timed out',
    )

    const candidates: string[] = []
    if (html) {
      const href = findIconHref(html)
      if (href) candidates.push(resolveIconUrl(parsed, href))
    }
    candidates.push(new URL('/favicon.ico', parsed.origin).href)

    for (const candidate of candidates) {
      const exists = await withUpstreamTimeout(
        faviconExists(candidate, fetchImpl),
        UPSTREAM_TIMEOUT_MS,
        'Favicon fetch timed out',
      )
      if (exists) return { ok: true, logo: candidate }
    }

    return { ok: false, error: 'No favicon found for this URL.' }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not fetch favicon',
    }
  }
}
