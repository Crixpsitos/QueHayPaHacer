import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import * as v from "valibot"
import { hasValidBearer } from "@/app/api/_lib/bearerAuth"
import { HOLIDAYS_TAG, TRANSIT_TAG } from "@/app/actions/config/_tags"

// Claves de configuración con caché → su etiqueta. Aquí se suman las nuevas (p. ej. rutas de bus).
const TAGS: Record<string, string> = { holidays: HOLIDAYS_TAG, transit: TRANSIT_TAG }

const Body = v.object({ key: v.picklist(Object.keys(TAGS) as [string, ...string[]]) })

/**
 * Invalida la caché de una configuración editable (festivos...) tras un cambio hecho fuera de la app
 * (scripts de siembra o carga). El panel de administración usa sus Server Actions (`updateTag`) y no pasa por aquí.
 * Auth: Bearer `SITE_REVALIDATE_WEBHOOK_SECRET` (el mismo de /api/sites/revalidate).
 */
export async function POST(request: Request) {
  const secret = process.env.SITE_REVALIDATE_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "Revalidation webhook is not configured." }, { status: 503 })
  if (!hasValidBearer(request, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = v.safeParse(Body, await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid body." }, { status: 400 })

  revalidateTag(TAGS[parsed.output.key], { expire: 0 })
  return NextResponse.json({ success: true })
}
