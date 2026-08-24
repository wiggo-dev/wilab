'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  type DragPreviewState,
  previewOrder,
  shouldShowDropSlot,
} from '@/lib/landing/drag-preview'

export function useReorderDrag({
  zone,
  order,
  onCommit,
}: {
  zone: 'grid' | 'pinned'
  order: string[]
  onCommit: (id: string, beforeId: string | null) => void
}) {
  const [drag, setDrag] = useState<DragPreviewState | null>(null)
  const dragRef = useRef<DragPreviewState | null>(null)
  const didDropRef = useRef(false)

  useEffect(() => {
    dragRef.current = drag
  }, [drag])

  const setDragState = useCallback((next: DragPreviewState | null) => {
    dragRef.current = next
    setDrag(next)
  }, [])

  const begin = useCallback(
    (id: string) => {
      didDropRef.current = false
      setDragState({ zone, draggedId: id, overId: id })
    },
    [setDragState, zone],
  )

  const hover = useCallback(
    (id: string) => {
      const current = dragRef.current
      if (!current || current.zone !== zone) return
      if (current.overId === id) return
      setDragState({ ...current, overId: id })
    },
    [setDragState, zone],
  )

  const dropCommit = useCallback(() => {
    const current = dragRef.current
    if (!current?.overId || current.draggedId === current.overId) {
      setDragState(null)
      return
    }

    didDropRef.current = true
    onCommit(current.draggedId, current.overId)
    setDragState(null)
  }, [onCommit, setDragState])

  const end = useCallback(() => {
    if (!didDropRef.current) {
      setDragState(null)
    }
    didDropRef.current = false
  }, [setDragState])

  // Preview for visuals only — keep React children on `order` so HTML5 drag
  // does not remount/move the dragged DOM node mid-gesture (which flashes).
  const displayOrder = previewOrder(order, drag, zone)

  const visualIndexById = useMemo(() => {
    const map = new Map<string, number>()
    displayOrder.forEach((id, index) => {
      map.set(id, index)
    })
    return map
  }, [displayOrder])

  const visualIndex = useCallback(
    (id: string) => visualIndexById.get(id) ?? 0,
    [visualIndexById],
  )

  const isDragging = useCallback(
    (id: string) => drag != null && drag.zone === zone && drag.draggedId === id,
    [drag, zone],
  )

  const isDropTarget = useCallback(
    (id: string) => shouldShowDropSlot(drag, zone, id),
    [drag, zone],
  )

  return {
    drag,
    /** Committed id order — use this for React children (stable DOM). */
    sourceOrder: order,
    /** Preview id order during drag — drives CSS `order`, not DOM order. */
    displayOrder,
    visualIndex,
    begin,
    hover,
    dropCommit,
    end,
    isDragging,
    isDropTarget,
  }
}
