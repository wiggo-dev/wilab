export function trimBase(serviceUrl: string): string {
  return serviceUrl.replace(/\/$/, '')
}

export type GetJsonOptions = {
  headers?: HeadersInit
  fetch?: typeof fetch
  label: string
}

export async function getJson<T>(url: string, options: GetJsonOptions): Promise<T> {
  const fetchImpl = options.fetch ?? fetch
  const response =
    options.headers === undefined
      ? await fetchImpl(url)
      : await fetchImpl(url, { headers: options.headers })

  if (!response.ok) {
    throw new Error(`${options.label} failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}
