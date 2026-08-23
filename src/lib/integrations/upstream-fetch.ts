import http from 'node:http'
import https from 'node:https'

const insecureHttpsAgent = new https.Agent({ rejectUnauthorized: false })

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {}
  if (headers instanceof Headers) return Object.fromEntries(headers.entries())
  if (Array.isArray(headers)) return Object.fromEntries(headers)
  return headers
}

function requestUrl(
  url: URL,
  init: RequestInit | undefined,
  rejectUnauthorized: boolean,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === 'https:' ? https : http
    const req = lib.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: init?.method ?? 'GET',
        headers: normalizeHeaders(init?.headers),
        agent: url.protocol === 'https:' && !rejectUnauthorized ? insecureHttpsAgent : undefined,
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => {
          resolve(
            new Response(Buffer.concat(chunks), {
              status: res.statusCode ?? 500,
              headers: Object.fromEntries(
                Object.entries(res.headers).flatMap(([key, value]) =>
                  value === undefined
                    ? []
                    : [[key, Array.isArray(value) ? value.join(', ') : String(value)]],
                ),
              ),
            }),
          )
        })
      },
    )

    req.on('error', reject)
    req.end()
  })
}

/** Server-side fetch for homelab upstreams; tolerates self-signed HTTPS certs. */
export async function upstreamFetch(input: string | URL, init?: RequestInit): Promise<Response> {
  const url = input instanceof URL ? input : new URL(input)

  if (url.protocol === 'https:') {
    return requestUrl(url, init, false)
  }

  return fetch(input, init)
}
