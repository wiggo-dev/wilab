import { getCatalog } from '@/lib/catalog/catalog'

export async function GET() {
  return Response.json(getCatalog())
}
