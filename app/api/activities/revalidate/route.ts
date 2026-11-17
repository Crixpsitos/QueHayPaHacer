import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import * as v from "valibot"
import { hasValidBearer } from "@/app/api/_lib/bearerAuth"
import { clearActivityListable } from "@/infraestructure/di/container"

const Id = v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{1,128}$/))
const Body = v.object({
  activityId: v.optional(Id),
  /** Slug de la actividad (la ficha se cachea también por slug). */
  slug: v.optional(v.pipe(v.string(), v.regex(/^[a-z0-9-]{1,160}$/))),
  /** Sitio al que pertenece: refresca su bloque de actividades y su carta. */
  siteId: v.optional(Id),
  ownerIds: v.optional(v.pipe(v.array(Id), v.maxLength(4))),
})

/**
 * Refresca las cachés de actividades (y de la carta del sitio) tras un cambio hecho FUERA de la app (scripts de carga,
 * correcciones a mano en Firestore): ahí no se puede llamar a `updateTag`. Mismos nombres de tag que `revalidateActivity`
 * (app/actions/activities/_revalidate.ts) y que la carta (`site-catalog-<id>`).
 * Auth: Bearer `SITE_REVALIDATE_WEBHOOK_SECRET` (el mismo de /api/sites/revalidate). Route Handler → `expire: 0`.
 */
export async function POST(request: Request) {
  const secret = process.env.SITE_REVALIDATE_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "Revalidation webhook is not configured." }, { status: 503 })
  if (!hasValidBearer(request, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = v.safeParse(Body, await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid body." }, { status: 400 })

  const { activityId, slug, siteId, ownerIds = [] } = parsed.output
  const tags = new Set<string>(["activity-list", "promo-activity-ids", "sitemap"])
  if (activityId) tags.add(`activity-${activityId}`)
  if (slug) tags.add(`activity-slug-${slug}`)
  if (siteId) { tags.add(`site-${siteId}-activities`); tags.add(`site-catalog-${siteId}`) }
  for (const uid of ownerIds) tags.add(`activities-${uid}`)
  clearActivityListable()
  for (const tag of tags) revalidateTag(tag, { expire: 0 })
  return NextResponse.json({ success: true, tags: tags.size })
}
