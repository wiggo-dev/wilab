import { describe, expect, it } from 'vitest'
import { previewOrder, shouldShowDropSlot } from './drag-preview'

describe('drag preview helpers', () => {
  it('previewOrder moves the dragged id before the hover target', () => {
    expect(
      previewOrder(['a', 'b', 'c'], { zone: 'grid', draggedId: 'c', overId: 'a' }, 'grid'),
    ).toEqual(['c', 'a', 'b'])
  })

  it('previewOrder ignores the other zone and identical ids', () => {
    expect(
      previewOrder(['a', 'b', 'c'], { zone: 'pinned', draggedId: 'c', overId: 'a' }, 'grid'),
    ).toEqual(['a', 'b', 'c'])
    expect(
      previewOrder(['a', 'b', 'c'], { zone: 'grid', draggedId: 'a', overId: 'a' }, 'grid'),
    ).toEqual(['a', 'b', 'c'])
  })

  it('shouldShowDropSlot only for a different hover target in the same zone', () => {
    expect(
      shouldShowDropSlot({ zone: 'grid', draggedId: 'a', overId: 'b' }, 'grid', 'b'),
    ).toBe(true)
    expect(
      shouldShowDropSlot({ zone: 'grid', draggedId: 'a', overId: 'a' }, 'grid', 'a'),
    ).toBe(false)
    expect(
      shouldShowDropSlot({ zone: 'pinned', draggedId: 'a', overId: 'b' }, 'grid', 'b'),
    ).toBe(false)
  })
})
