import { activeSanctions as _active, canFlag, resolveFlag, sanctionExpiry, isRestricted, type FlagReason, type Sanction } from "@/domain/entities/activities/moderation/reviewModeration"
import { activitySanctionNotification, reviewFlagResolvedNotification } from "@/domain/entities/notification/messages"
import type { NewNotification } from "@/domain/entities/notification/Notification"
import type { ActivityReview } from "@/domain/entities/activities/review/ActivityReview"
import type { IActivityReviewRepository } from "@/domain/repository/activities/IActivityReviewRepository"
import type { IActivitySanctionRepository } from "@/domain/repository/activities/IActivitySanctionRepository"
import { containsContactInfo } from "@/domain/entities/activities/review/ActivityReview"
import { reviewKey } from "@/domain/entities/activities/review/reviewIdentity"

const COOLDOWN_MS = 30_000
const YEAR_MS = 365 * 86_400_000
const REPLY_MAX = 600
void _active

export interface ModerationDeps {
  reviews: IActivityReviewRepository
  sanctions: IActivitySanctionRepository
  getActivity: (id: string) => Promise<{ id: string; slug: string; title: string; ownerUid: string; siteOwnerUid: string | null } | null>
  notify: (uid: string, n: NewNotification, id?: string) => Promise<void>
  clock: () => Date
  log: (message: string) => void
  /** Último cuestionamiento por cuenta (cooldown). A nivel de módulo en producción. */
  lastFlag?: Map<string, number>
}

/** Cuestionar reseñas (quien organiza), responderlas y resolverlas (QHPA). El motivo y la nota nunca salen a la vista pública. */
export class ReviewModerationService {
  private readonly last: Map<string, number>
  constructor(private readonly d: ModerationDeps) { this.last = d.lastFlag ?? new Map() }

  private async findByKey(activityId: string, key: string): Promise<ActivityReview | null> {
    const all = await this.d.reviews.listByActivity(activityId, 500)
    return all.find((r) => reviewKey(r.activityId, r.uid) === key) ?? null
  }

  async flag(uid: string, activityId: string, key: string, input: { reason: FlagReason; note: string }): Promise<void> {
    const now = this.d.clock()
    const prev = this.last.get(uid)
    if (prev !== undefined && now.getTime() - prev < COOLDOWN_MS) throw new Error("Espera unos segundos antes de cuestionar otra reseña.")
    this.last.set(uid, now.getTime())
    try {
      const a = await this.d.getActivity(activityId)
      if (!a) throw new Error("Esa actividad no existe.")
      const review = await this.findByKey(activityId, key)
      if (!review) throw new Error("Esa reseña no existe.")
      const [sanctions, openByAccount, openOnActivity] = await Promise.all([this.d.sanctions.listByUid(uid), this.d.reviews.countOpenFlags({ by: uid }), this.d.reviews.countOpenFlags({ activityId })])
      const error = canFlag({ uid, isHost: uid === a.ownerUid || uid === a.siteOwnerUid, openByAccount, openOnActivity, alreadyFlaggedThis: review.flag !== null, reviewStatus: review.status, sanctions }, input, now)
      if (error) throw new Error(error)
      const changed = await this.d.reviews.setFlag(review.id, { by: uid, reason: input.reason, note: input.note.trim(), at: now })
      if (!changed) throw new Error("Esta reseña ya está en revisión o fue retirada.")
      this.d.log(`alert=qhpa_new_flag review=${review.id} activity=${activityId}`)
    } catch (e) {
      if (this.last.get(uid) === now.getTime()) this.last.delete(uid)
      throw e
    }
  }

  async reply(uid: string, activityId: string, key: string, text: string): Promise<void> {
    const a = await this.d.getActivity(activityId)
    if (!a) throw new Error("Esa actividad no existe.")
    if (uid !== a.ownerUid && uid !== a.siteOwnerUid) throw new Error("Solo quien organiza la actividad puede responder.")
    const t = text.trim()
    if (!t) throw new Error("Escribe tu respuesta.")
    if (t.length > REPLY_MAX) throw new Error(`La respuesta admite máximo ${REPLY_MAX} caracteres.`)
    if (containsContactInfo(t)) throw new Error("No se pueden incluir enlaces, correos ni teléfonos.")
    const review = await this.findByKey(activityId, key)
    if (!review) throw new Error("Esa reseña no existe.")
    await this.d.reviews.setReply(review.id, { text: t, at: this.d.clock() })
  }

  /** QHPA resuelve. `abusive` = el cuestionamiento fue claramente abusivo (sanciona al anfitrión si la reseña era real). */
  async resolve(o: { reviewId: string; outcome: "upheld" | "removed"; abusive: boolean; by: string }): Promise<{ review: ActivityReview }> {
    const now = this.d.clock()
    const review = await this.d.reviews.getById(o.reviewId)
    if (!review || review.status !== "flagged" || !review.flag) throw new Error("Esa reseña no está en verificación.")
    const a = await this.d.getActivity(review.activityId)
    const since = new Date(now.getTime() - YEAR_MS)
    const hostUid = review.flag.by
    const bySystem = hostUid === "system" // ocultado preventivo por reportes: no hay anfitrión que sancionar ni avisar
    const [priorHost, priorReviewer] = await Promise.all([this.d.sanctions.countSince(hostUid, "host", since), this.d.sanctions.countSince(review.uid, "reviewer", since)])
    const fx = resolveFlag(o.outcome, { abusive: o.abusive, priorHost, priorReviewer }, now)
    const done = await this.d.reviews.resolveFlag(review.id, { status: fx.reviewStatus, resolution: o.outcome, resolvedBy: o.by, at: now })
    if (!done) throw new Error("Esa reseña no está en verificación.")
    if (fx.sanction && !(bySystem && fx.sanction.role === "host")) {
      const uid = fx.sanction.role === "reviewer" ? review.uid : hostUid
      const s: Sanction = { uid, role: fx.sanction.role, kind: fx.sanction.kind, reason: `review_flag_${o.outcome}`, activityId: review.activityId, reviewId: review.id, createdAt: now, expiresAt: sanctionExpiry(now, fx.sanction.days), createdBy: o.by }
      await this.d.sanctions.add(s)
      await this.d.notify(uid, activitySanctionNotification({ kind: s.kind, role: s.role, days: fx.sanction.days }), `sanction_${review.id}`).catch(() => undefined)
    }
    const title = a?.title ?? "la actividad", slug = a?.slug ?? ""
    await Promise.all([
      bySystem ? Promise.resolve() : this.d.notify(hostUid, reviewFlagResolvedNotification({ title, slug, outcome: o.outcome, audience: "host" }), `flagres_h_${review.id}`),
      this.d.notify(review.uid, reviewFlagResolvedNotification({ title, slug, outcome: o.outcome, audience: "reviewer" }), `flagres_r_${review.id}`),
    ]).catch(() => undefined)
    return { review: done.review }
  }

  listOpen(limit = 50): Promise<ActivityReview[]> { return this.d.reviews.listFlagged(limit) }
  async isRestrictedReviewer(uid: string): Promise<boolean> { return isRestricted(await this.d.sanctions.listByUid(uid), uid, "reviewer", this.d.clock()) }
}
