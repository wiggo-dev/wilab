import type { APIRequestContext } from '@playwright/test'
import { expect } from '@playwright/test'
import type { WilabConfig } from '../src/lib/config/types'
import { FIXTURE_CONFIG } from '../src/lib/landing/fixtures'

export async function seedConfig(
  request: APIRequestContext,
  config: WilabConfig = FIXTURE_CONFIG,
) {
  const response = await request.put('/api/config', { data: config })
  expect(response.ok()).toBeTruthy()
}
