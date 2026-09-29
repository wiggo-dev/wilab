/* wilab service worker — caches static assets only (not HTML navigations).
 * Live glances and other /api/* routes are always network-only.
 * Offline: the document itself is not cached, so the installed app needs network. */

const CACHE = 'wilab-shell-v2'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(['/icons/icon-192.png', '/icons/icon-512.png', '/manifest.webmanifest']),
    ),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      // Drop previously cached hashed chunks so deploys don't accumulate forever.
      const cache = await caches.open(CACHE)
      const requests = await cache.keys()
      await Promise.all(
        requests
          .filter((request) => new URL(request.url).pathname.startsWith('/_next/static/'))
          .map((request) => cache.delete(request)),
      )
    })(),
  )
  self.clients.claim()
})

async function staleWhileRevalidate(request, cache) {
  const cached = await cache.match(request)
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        void cache.put(request, response.clone())
      }
      return response
    })
    .catch((error) => {
      if (cached) return cached
      throw error
    })
  return cached || networkPromise
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Never cache API — glances and config need the network.
  if (url.pathname.startsWith('/api/')) return

  // Do not intercept navigations — offline shows the browser offline page.
  if (request.mode === 'navigate') return

  const isRefreshable =
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/sw.js' ||
    url.pathname === '/icon.svg'

  const isImmutableStatic =
    url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/catalog/')

  if (!isRefreshable && !isImmutableStatic) return

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      if (isRefreshable) {
        return staleWhileRevalidate(request, cache)
      }

      const cached = await cache.match(request)
      if (cached) return cached
      const response = await fetch(request)
      if (response.ok) {
        void cache.put(request, response.clone())
      }
      return response
    }),
  )
})
