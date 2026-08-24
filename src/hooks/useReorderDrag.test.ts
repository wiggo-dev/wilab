/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useReorderDrag } from './useReorderDrag'

describe('useReorderDrag', () => {
  it('previews order while dragging over a target in the same zone', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() =>
      useReorderDrag({
        zone: 'grid',
        order: ['a', 'b', 'c'],
        onCommit,
      }),
    )

    expect(result.current.displayOrder).toEqual(['a', 'b', 'c'])

    act(() => {
      result.current.begin('c')
    })
    act(() => {
      result.current.hover('a')
    })

    expect(result.current.displayOrder).toEqual(['c', 'a', 'b'])
    expect(result.current.isDragging('c')).toBe(true)
    expect(result.current.isDropTarget('a')).toBe(true)
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('commits on drop and clears drag state', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() =>
      useReorderDrag({
        zone: 'pinned',
        order: ['a', 'b', 'c'],
        onCommit,
      }),
    )

    act(() => {
      result.current.begin('c')
    })
    act(() => {
      result.current.hover('a')
    })
    act(() => {
      result.current.dropCommit()
    })

    expect(onCommit).toHaveBeenCalledWith('c', 'a')
    expect(result.current.drag).toBeNull()
    expect(result.current.displayOrder).toEqual(['a', 'b', 'c'])
  })

  it('cancels on end when no drop happened', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() =>
      useReorderDrag({
        zone: 'grid',
        order: ['a', 'b', 'c'],
        onCommit,
      }),
    )

    act(() => {
      result.current.begin('b')
    })
    act(() => {
      result.current.hover('a')
    })
    act(() => {
      result.current.end()
    })

    expect(onCommit).not.toHaveBeenCalled()
    expect(result.current.drag).toBeNull()
    expect(result.current.displayOrder).toEqual(['a', 'b', 'c'])
  })

  it('does not commit when dropped on itself', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() =>
      useReorderDrag({
        zone: 'grid',
        order: ['a', 'b'],
        onCommit,
      }),
    )

    act(() => {
      result.current.begin('a')
    })
    act(() => {
      result.current.dropCommit()
    })

    expect(onCommit).not.toHaveBeenCalled()
    expect(result.current.drag).toBeNull()
  })

  it('keeps sourceOrder stable while displayOrder and visualIndex preview the move', () => {
    const { result } = renderHook(() =>
      useReorderDrag({
        zone: 'grid',
        order: ['a', 'b', 'c'],
        onCommit: vi.fn(),
      }),
    )

    act(() => {
      result.current.begin('c')
    })
    act(() => {
      result.current.hover('a')
    })

    expect(result.current.sourceOrder).toEqual(['a', 'b', 'c'])
    expect(result.current.displayOrder).toEqual(['c', 'a', 'b'])
    expect(result.current.visualIndex('c')).toBe(0)
    expect(result.current.visualIndex('a')).toBe(1)
    expect(result.current.visualIndex('b')).toBe(2)
  })

  it('ignores hover on the dragged id so adjacent swaps do not flip-flop', () => {
    const { result } = renderHook(() =>
      useReorderDrag({
        zone: 'grid',
        order: ['a', 'b', 'c'],
        onCommit: vi.fn(),
      }),
    )

    act(() => {
      result.current.begin('b')
    })
    act(() => {
      result.current.hover('a')
    })
    expect(result.current.displayOrder).toEqual(['b', 'a', 'c'])
    expect(result.current.drag?.overId).toBe('a')

    act(() => {
      result.current.hover('b')
    })
    expect(result.current.drag?.overId).toBe('a')
    expect(result.current.displayOrder).toEqual(['b', 'a', 'c'])
  })
})
