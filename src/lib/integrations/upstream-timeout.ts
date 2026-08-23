export async function withUpstreamTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message = 'timeout',
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs)
    }),
  ])
}
