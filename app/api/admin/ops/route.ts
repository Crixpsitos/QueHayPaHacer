import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import * as v from "valibot"
import { FieldValue } from "firebase-admin/firestore"
import { hasValidBearer } from "@/app/api/_lib/bearerAuth"
import { siteTagsToRevalidate } from "@/app/api/sites/_lib/siteTags"
import { clearActivityListable } from "@/infraestructure/di/container"
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase"
import { ActivityFirebaseRepository } from "@/infraestructure/firebase/repositories/activities/ActivityFirebaseRepository"
import { ActivityReviewFirebaseRepository } from "@/infraestructure/firebase/repositories/activities/ActivityReviewFirebaseRepository"
import { ActivitySanctionFirebaseRepository } from "@/infraestructure/firebase/repositories/activities/ActivitySanctionFirebaseRepository"
import { ActivityAppealFirebaseRepository } from "@/infraestructure/firebase/repositories/activities/ActivityAppealFirebaseRepository"
import { NotificationFirebaseRepository } from "@/infraestructure/firebase/repositories/notification/NotificationFirebaseRepository"
import { NotificationService } from "@/application/services/notification/NotificationService"
import { ReviewModerationService } from "@/application/services/activities/ReviewModerationService"
import { ActivityAppealService } from "@/application/services/activities/ActivityAppealService"
import { activityTransferredNotification, claimResolvedNotification } from "@/domain/entities/notification/messages"
import { transferPatch } from "@/domain/entities/activities/ownershipTransfer"

const Id = v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{1,160}$/))
const Reviewer = v.pipe(v.string(), v.nonEmpty())
const Body = v.variant("action", [
  v.object({ action: v.literal("claimApprove"), claimId: Id, reviewer: Reviewer }),
  v.object({ action: v.literal("claimReject"), claimId: Id, reason: v.pipe(v.string(), v.minLength(3), v.maxLength(300)), reviewer: Reviewer }),
  v.object({ action: v.literal("reviewResolve"), reviewId: Id, outcome: v.picklist(["upheld", "removed"] as const), abusive: v.optional(v.boolean()), reviewer: Reviewer }),
  v.object({ action: v.literal("appealResolve"), reviewId: Id, decision: v.picklist(["restore", "reject"] as const), reviewer: Reviewer }),
  v.object({ action: v.literal("revalidateHome") }),
])

/**
 * Operaciones del panel de administración que en la app viven en scripts o no tenían endpoint (la Cloud Function
 * `adminGateway` las llama con el secreto; el panel estático nunca lo ve). Misma lógica que `scripts/list-site-claims.ts`,
 * `list-activity-flags.ts` y `list-activity-appeals.ts`, y a diferencia de los scripts invalida la caché.
 * Auth: Bearer `SITE_REVALIDATE_WEBHOOK_SECRET`.
 */
export async function POST(request: Request) {
  const secret = process.env.SITE_REVALIDATE_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "Admin ops are not configured." }, { status: 503 })
  if (!hasValidBearer(request, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const parsed = v.safeParse(Body, await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid body." }, { status: 400 })

  try {
    const op = parsed.output
    const db = getFirebaseFirestore()
    const notifications = new NotificationService(new NotificationFirebaseRepository(db))
    const expire = (tags: Iterable<string>) => { for (const t of tags) revalidateTag(t, { expire: 0 }) }

    if (op.action === "revalidateHome") {
      expire(["escapadas", "home-view", "active-campaigns"])
      return NextResponse.json({ success: true })
    }

    if (op.action === "claimReject") {
      const ref = db.collection("siteClaims").doc(op.claimId)
      const snap = await ref.get()
      if (!snap.exists) return NextResponse.json({ error: "No existe el reclamo." }, { status: 404 })
      if (snap.get("status") !== "pending") return NextResponse.json({ error: `El reclamo ya está ${snap.get("status")}.` }, { status: 409 })
      await ref.update({ status: "rejected", rejectionReason: op.reason.trim(), reviewedAt: FieldValue.serverTimestamp(), reviewedBy: op.reviewer })
      await notifications.notify(snap.get("claimantUid"), claimResolvedNotification({ siteName: snap.get("siteName"), approved: false, reason: op.reason }), `claim-resolved-${op.claimId}`)
      return NextResponse.json({ success: true })
    }

    if (op.action === "claimApprove") {
      const claimRef = db.collection("siteClaims").doc(op.claimId)
      let toNotify: { uid: string; siteName: string; approved: boolean; reason?: string; id: string }[] = []
      let transferred: { uid: string; activityTitle: string; siteName: string; id: string }[] = []
      let stale: { siteId: string; authorIds: string[] } | null = null
      await db.runTransaction(async (tx) => {
        toNotify = []; transferred = []; stale = null
        const claimSnap = await tx.get(claimRef)
        if (!claimSnap.exists) throw new HttpError(404, "No existe el reclamo.")
        const claim = claimSnap.data()!
        if (claim.status !== "pending") throw new HttpError(409, `El reclamo ya está ${claim.status}.`)
        const siteRef = db.collection("sites").doc(claim.siteId)
        const [siteSnap, userSnap, othersSnap, activitiesSnap] = await Promise.all([
          tx.get(siteRef),
          tx.get(db.collection("users").doc(claim.claimantUid)),
          tx.get(db.collection("siteClaims").where("siteId", "==", claim.siteId).where("status", "==", "pending")),
          tx.get(db.collection("activities").where("siteId", "==", claim.siteId)),
        ])
        if (!siteSnap.exists) throw new HttpError(404, "No existe el sitio.")
        const site = siteSnap.data()!
        const author: Record<string, string> = { id: claim.claimantUid, displayName: userSnap.get("displayName") || claim.claimantName }
        const photoURL = userSnap.get("photoURL")
        if (photoURL) author.photoURL = photoURL
        const previous = { author: site.author ?? null, verification: site.verification ?? null, publishedAs: site.publishedAs ?? null }
        const owner = { uid: claim.claimantUid, displayName: author.displayName, photoURL: author.photoURL ?? "" }
        const moves = activitiesSnap.docs.flatMap((d) => {
          const patch = transferPatch({ kind: "site", siteId: claim.siteId, ownerUid: d.get("ownerUid") }, owner)
          return patch ? [{ ref: d.ref, id: d.id, title: d.get("title") as string, patch }] : []
        })
        tx.update(siteRef, { verification: "verified", publishedAs: "owner", author, updatedAt: FieldValue.serverTimestamp() })
        tx.update(claimRef, { status: "approved", reviewedAt: FieldValue.serverTimestamp(), reviewedBy: op.reviewer, previousSite: previous })
        for (const m of moves) {
          tx.update(m.ref, { ownerUid: m.patch.ownerUid, host: m.patch.host, updatedAt: FieldValue.serverTimestamp() })
          transferred.push({ uid: m.patch.previousOwnerUid, activityTitle: m.title, siteName: site.name, id: m.id })
        }
        toNotify.push({ uid: claim.claimantUid, siteName: site.name, approved: true, id: op.claimId })
        stale = { siteId: claim.siteId, authorIds: [claim.claimantUid, previous.author?.id ?? previous.author?.uid] }
        for (const d of othersSnap.docs.filter((x) => x.id !== op.claimId)) {
          tx.update(d.ref, { status: "rejected", rejectionReason: "Otro reclamo aprobado", reviewedAt: FieldValue.serverTimestamp(), reviewedBy: op.reviewer })
          toNotify.push({ uid: d.get("claimantUid"), siteName: site.name, approved: false, reason: "Otro reclamo fue aprobado primero.", id: d.id })
        }
      })
      for (const n of toNotify) await notifications.notify(n.uid, claimResolvedNotification(n), `claim-resolved-${n.id}`)
      for (const t of transferred) await notifications.notify(t.uid, activityTransferredNotification({ title: t.activityTitle, siteName: t.siteName }), `activity-transferred-${t.id}`)
      const s = stale as { siteId: string; authorIds: string[] } | null
      if (s) {
        expire(siteTagsToRevalidate(s.siteId, s.authorIds))
        if (transferred.length) { clearActivityListable(); expire(["activity-list", `site-${s.siteId}-activities`, `site-catalog-${s.siteId}`]) }
      }
      return NextResponse.json({ success: true, notified: toNotify.length, activitiesMoved: transferred.length })
    }

    // Reseñas y apelaciones: las decisiones cambian el promedio de la actividad o del sitio.
    const reviews = new ActivityReviewFirebaseRepository(db)
    const review = await reviews.getById(op.reviewId)
    const refresh = () => {
      if (!review) return
      clearActivityListable()
      expire(["activity-list", `activity-${review.activityId}`])
      if (review.siteId) expire(siteTagsToRevalidate(review.siteId))
    }
    if (op.action === "reviewResolve") {
      const activities = new ActivityFirebaseRepository(db)
      const svc = new ReviewModerationService({
        reviews, sanctions: new ActivitySanctionFirebaseRepository(db),
        getActivity: async (id) => { const a = await activities.findById(id); return a ? { id: a.id, slug: a.slug, title: a.title, ownerUid: a.ownerUid, siteOwnerUid: null } : null },
        notify: (uid, n, id) => notifications.notify(uid, n, id), clock: () => new Date(), log: () => undefined,
      })
      await svc.resolve({ reviewId: op.reviewId, outcome: op.outcome, abusive: op.abusive ?? false, by: op.reviewer })
      refresh()
      return NextResponse.json({ success: true })
    }
    // appealResolve
    const svc = new ActivityAppealService({
      appeals: new ActivityAppealFirebaseRepository(db), getReview: (id) => reviews.getById(id),
      restore: async (id) => (await reviews.restoreRemoved(id)) !== null, clock: () => new Date(),
    })
    await svc.resolve(op.reviewId, op.decision === "restore" ? "restored" : "rejected", op.reviewer)
    refresh()
    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status })
    console.error("admin ops error", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 })
  }
}

class HttpError extends Error { constructor(readonly status: number, message: string) { super(message) } }
