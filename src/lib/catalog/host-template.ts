export const HOST_PLACEHOLDER = '{host}'

export function catalogUrlUsesHostTemplate(url: string): boolean {
  return url.includes(HOST_PLACEHOLDER)
}

export function substituteHostInUrl(url: string, host: string): string {
  return url.replaceAll(HOST_PLACEHOLDER, host.trim())
}
