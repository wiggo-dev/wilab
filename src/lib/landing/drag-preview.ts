import { moveId } from '@/lib/config/mutations'

export type DragPreviewState = {
  zone: 'grid' | 'pinned'
  draggedId: string
  overId: string | null
}

/** Resolve the order that would result from dropping draggedId before overId. */
export function previewOrder(
  order: string[],
  drag: DragPreviewState | null,
  zone: 'grid' | 'pinned',
): string[] {
  if (!drag || drag.zone !== zone || !drag.overId || drag.draggedId === drag.overId) {
    return order
  }
  return moveId(order, drag.draggedId, drag.overId)
}

export function shouldShowDropSlot(
  drag: DragPreviewState | null,
  zone: 'grid' | 'pinned',
  serviceId: string,
): boolean {
  return (
    drag != null &&
    drag.zone === zone &&
    drag.overId === serviceId &&
    drag.draggedId !== serviceId
  )
}
