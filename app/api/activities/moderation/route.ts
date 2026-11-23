import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import * as v from "valibot"
import { hasValidBearer } from "@/app/api/_lib/bearerAuth"
import { clearActivityListable } from "@/infraestructure/di/container"
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase"
import { ActivityFirebaseRepository } from "@/infraestructure/firebase/repositories/activities/ActivityFirebaseRepository"
import { ActivityAccountFirebaseRepository } from "@/infraestructure/firebase/repositories/activities/ActivityAccountFirebaseRepository"
import { NotificationFirebaseRepository } from "@/infraestructure/firebase/repositories/notification/NotificationFirebaseRepository"
import { NotificationService } from "@/application/services/notification/NotificationService"
import { ActivityModerationService } from "@/application/services/activities/ActivityModerationService"

const Body = v.object({
  activityId: v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{1,128}$/)),
  decision: v.picklist(["approved", "rejected"] as const),
  reason: v.optional(v.pipe(v.string(), v.maxLength(300))),
  reviewer: v.pipe(v.string(), v.nonEmpty()),
})

/**
 * Aprobar o rechazar una actividad en revisión (lo llama el panel de administración vía Cloud Function).
 * Misma lógica que `scripts/list-activities.ts` (ActivityModerationService: cuenta de confianza + aviso al creador) y,
 * a diferencia del script, invalida la caché. Auth: Bearer `SITE_REVALIDATE_WEBHOOK_SECRET`.
 */
export async function POST(request: Request) {
  const secret = process.env.SITE_REVALIDATE_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "Moderation webhook is not configured." }, { status: 503 })
  if (!hasValidBearer(request, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = v.safeParse(Body, await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid body." }, { status: 400 })
  const { activityId, decision, reason, reviewer } = parsed.output

  const db = getFirebaseFirestore()
  const repo = new ActivityFirebaseRepository(db)
  const notifications = new NotificationService(new NotificationFirebaseRepository(db))
  const svc = new ActivityModerationService({
    repo,
    accounts: new ActivityAccountFirebaseRepository(db),
    notify: (uid, n) => notifications.notify(uid, n),
    clock: () => new Date(),
  })

  const result = decision === "approved" ? await svc.approve(activityId, reviewer) : await svc.reject(activityId, reviewer, reason ?? "")
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 })

  const a = await repo.findById(activityId)
  const tags = new Set<string>(["activity-list", "promo-activity-ids", "sitemap", `activity-${activityId}`])
  if (a?.slug) tags.add(`activity-slug-${a.slug}`)
  if (a?.siteId) { tags.add(`site-${a.siteId}-activities`); tags.add(`site-catalog-${a.siteId}`) }
  if (a?.ownerUid) tags.add(`activities-${a.ownerUid}`)
  clearActivityListable()
  for (const tag of tags) revalidateTag(tag, { expire: 0 })
  return NextResponse.json({ success: true, decision })
}
