export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getConfigStore } = await import('./lib/config/store')
    await getConfigStore().load()
  }
}
