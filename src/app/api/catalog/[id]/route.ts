import { getCatalogEntryById } from '@/lib/catalog/catalog'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const entry = getCatalogEntryById(id)

  if (!entry) {
    return Response.json({ error: 'Catalog entry not found' }, { status: 404 })
  }

  return Response.json(entry)
}
