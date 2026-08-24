import { describe, expect, it } from 'vitest'
import { classifyGlanceAttention } from './glance-attention'

describe('classifyGlanceAttention', () => {
  it('marks unavailable as error', () => {
    expect(classifyGlanceAttention({ status: 'unavailable', text: 'Unavailable' })).toBe('error')
  })

  it('marks HTTP status-code glances as error', () => {
    expect(classifyGlanceAttention({ status: 'healthy', text: '503' })).toBe('error')
    expect(classifyGlanceAttention({ status: 'healthy', text: '404' })).toBe('error')
  })

  it('marks unhealthy and missing text as warn', () => {
    expect(classifyGlanceAttention({ status: 'healthy', text: '2 unhealthy' })).toBe('warn')
    expect(classifyGlanceAttention({ status: 'healthy', text: '1 missing' })).toBe('warn')
    expect(classifyGlanceAttention({ status: 'healthy', text: 'Queue 2 · 1 missing' })).toBe('warn')
  })

  it('marks partial ratios as warn', () => {
    expect(classifyGlanceAttention({ status: 'healthy', text: '1/2 up' })).toBe('warn')
    expect(classifyGlanceAttention({ status: 'healthy', text: '0/5 cameras' })).toBe('warn')
    expect(classifyGlanceAttention({ status: 'healthy', text: '8/10 running' })).toBe('warn')
    expect(classifyGlanceAttention({ status: 'healthy', text: '2/4 indexers' })).toBe('warn')
    expect(classifyGlanceAttention({ status: 'healthy', text: '0 of 12 online' })).toBe('warn')
  })

  it('treats full ratios and idle informational glances as ok', () => {
    expect(classifyGlanceAttention({ status: 'healthy', text: '2/2 up' })).toBe('ok')
    expect(classifyGlanceAttention({ status: 'healthy', text: '5/5 cameras' })).toBe('ok')
    expect(classifyGlanceAttention({ status: 'healthy', text: '0/0 up' })).toBe('ok')
    expect(classifyGlanceAttention({ status: 'healthy', text: '0 playing' })).toBe('ok')
    expect(classifyGlanceAttention({ status: 'healthy', text: 'Up' })).toBe('ok')
    expect(classifyGlanceAttention({ status: 'healthy', text: 'Queue 0' })).toBe('ok')
    expect(classifyGlanceAttention({ status: 'stale', text: '12 clients' })).toBe('ok')
  })
})
