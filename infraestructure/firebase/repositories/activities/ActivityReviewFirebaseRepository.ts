import type { DocumentData, DocumentReference, DocumentSnapshot, Firestore, Transaction } from "firebase-admin/firestore"
import type { ActivityRating } from "@/domain/entities/activities/Activity"
import { applyReviewToRating, type ActivityReview, type ReviewFlag } from "@/domain/entities/activities/review/ActivityReview"
import { isSiteSubject, siteIdOfSubject } from "@/domain/entities/activities/review/subject"
import { reviewId } from "@/domain/entities/activities/review/reviewIdentity"
import type { IActivityReviewRepository } from "@/domain/repository/activities/IActivityReviewRepository"
import { FirebaseBaseRepository } from "../FirebaseBaseRepository"

const EMPTY: ActivityRating = { count: 0, sum: 0, avg: 0, dist: [0, 0, 0, 0, 0] }
const toDate = (v: unknown): Date => (v && typeof (v as { toDate?: unknown }).toDate === "function" ? (v as { toDate: () => Date }).toDate() : v instanceof Date ? v : new Date(0))
const toDateOrNull = (v: unknown): Date | null => (v ? toDate(v) : null)

function fromDoc(id: string, d: DocumentData): ActivityReview {
  return {
    id, activityId: d.activityId, siteId: d.siteId ?? null, subjectTitle: d.subjectTitle, subjectSlug: d.subjectSlug, uid: d.uid, rating: d.rating, title: d.title ?? "", body: d.body ?? "", visitedAt: d.visitedAt,
    media: d.media ?? [], coverIndex: d.coverIndex ?? 0, author: d.author, status: d.status,
    flag: d.flag ? { ...d.flag, at: toDate(d.flag.at), resolvedAt: toDateOrNull(d.flag.resolvedAt) ?? undefined } : null,
    ownerReply: d.ownerReply ? { text: d.ownerReply.text, at: toDate(d.ownerReply.at) } : null,
    createdAt: toDate(d.createdAt), updatedAt: toDate(d.updatedAt), editedAt: toDateOrNull(d.editedAt), declarationVersion: d.declarationVersion ?? "",
  }
}

/** `activityReviews/{activityId}_{uid}` (primer nivel). Guardar/borrar y el agregado `rating` de la actividad van en UNA transacción. */
export class ActivityReviewFirebaseRepository extends FirebaseBaseRepository implements IActivityReviewRepository {
  protected readonly collectionName = "activityReviews"
  constructor(db: Firestore) { super(db) }

  private activity(id: string) { return this.db.collection("activities").doc(id) }

  /**
   * Documentos cuyo promedio (`rating`) cuenta esta reseña, el primero es el «principal» (el que se devuelve):
   * reseña de sitio → el sitio; reseña de actividad → la actividad y, si tiene, el sitio vinculado.
   */
  private targets(subject: string, siteId?: string | null): { ref: DocumentReference; site: boolean }[] {
    if (isSiteSubject(subject)) return [{ ref: this.db.collection("sites").doc(siteIdOfSubject(subject)), site: true }]
    return [{ ref: this.activity(subject), site: false }, ...(siteId ? [{ ref: this.db.collection("sites").doc(siteId), site: true }] : [])]
  }

  private readAll(tx: Transaction, ts: { ref: DocumentReference; site: boolean }[]) { return Promise.all(ts.map((t) => tx.get(t.ref))) }

  /** Aplica la operación a cada promedio en la misma transacción. Devuelve el del documento principal. */
  private applyAll(tx: Transaction, ts: { ref: DocumentReference; site: boolean }[], snaps: DocumentSnapshot[], op: Parameters<typeof applyReviewToRating>[1]): ActivityRating {
    let main: ActivityRating = EMPTY
    ts.forEach((t, i) => {
      const snap = snaps[i]
      const current: ActivityRating = (snap.exists ? snap.get("rating") : null) ?? EMPTY
      const rating = applyReviewToRating(current, op)
      if (i === 0) main = rating
      if (!snap.exists) return
      tx.update(t.ref, t.site ? { rating } : { rating, "analytics.reviews": rating.count })
    })
    return main
  }

  async get(activityId: string, uid: string): Promise<ActivityReview | null> {
    const s = await this.collection.doc(reviewId(activityId, uid)).get()
    return s.exists ? fromDoc(s.id, s.data()!) : null
  }

  async save(review: ActivityReview): Promise<{ created: boolean; rating: ActivityRating }> {
    const ref = this.collection.doc(review.id)
    const ts = this.targets(review.activityId, review.siteId)
    return this.db.runTransaction(async (tx) => {
      const [mine, ...snaps] = await Promise.all([tx.get(ref), ...ts.map((t) => tx.get(t.ref))])
      if (!snaps[0].exists) throw new Error(isSiteSubject(review.activityId) ? "Ese sitio no existe." : "Esa actividad no existe.")
      if (mine.exists && !["published", "pendingMedia"].includes(mine.get("status"))) throw new Error(mine.get("status") === "flagged" ? "Tu reseña está en verificación: no se puede editar ahora." : "Esa reseña fue retirada: si crees que fue un error, puedes apelar.")
      const created = !mine.exists
      const rating = this.applyAll(tx, ts, snaps, created ? { type: "add", rating: review.rating } : { type: "edit", from: mine.get("rating"), to: review.rating })
      tx.set(ref, { ...review, siteId: review.siteId ?? null, flag: review.flag ?? null, ownerReply: review.ownerReply ?? null, editedAt: review.editedAt ?? null })
      return { created, rating }
    })
  }

  async remove(activityId: string, uid: string, opts?: { force?: boolean }): Promise<{ removed: boolean; rating: ActivityRating; media: { path: string; thumbnailPath?: string }[] }> {
    const ref = this.collection.doc(reviewId(activityId, uid))
    return this.db.runTransaction(async (tx) => {
      const mine = await tx.get(ref)
      const ts = this.targets(activityId, mine.exists ? mine.get("siteId") : null)
      const snaps = await this.readAll(tx, ts)
      const current: ActivityRating = (snaps[0].exists ? snaps[0].get("rating") : null) ?? EMPTY
      if (!mine.exists) return { removed: false, rating: current, media: [] }
      if (mine.get("status") === "flagged" && !opts?.force) throw new Error("FLAGGED")
      const counted = mine.get("status") === "published" || mine.get("status") === "flagged" || mine.get("status") === "pendingMedia"
      const rating = counted ? this.applyAll(tx, ts, snaps, { type: "remove", rating: mine.get("rating") }) : current
      tx.delete(ref)
      return { removed: true, rating, media: (mine.get("media") ?? []).map((m: { path: string; thumbnailPath?: string }) => ({ path: m.path, thumbnailPath: m.thumbnailPath })) }
    })
  }

  // Sin orderBy: evita un índice compuesto. El volumen por actividad/persona es pequeño y se corta aquí.
  async listByActivity(activityId: string, limit: number): Promise<ActivityReview[]> {
    const s = await this.collection.where("activityId", "==", activityId).limit(500).get()
    return s.docs.map((d) => fromDoc(d.id, d.data())).filter((r) => r.status === "published" || r.status === "flagged").sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit)
  }

  async listBySite(siteId: string, limit: number): Promise<ActivityReview[]> {
    const s = await this.collection.where("siteId", "==", siteId).limit(500).get()
    return s.docs.map((d) => fromDoc(d.id, d.data())).filter((r) => r.status === "published" || r.status === "flagged").sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit)
  }

  async listByAuthorSince(uid: string, since: Date): Promise<ActivityReview[]> {
    const s = await this.collection.where("uid", "==", uid).limit(200).get()
    return s.docs.map((d) => fromDoc(d.id, d.data())).filter((r) => r.createdAt >= since)
  }

  async getById(reviewId: string): Promise<ActivityReview | null> {
    const s = await this.collection.doc(reviewId).get()
    return s.exists ? fromDoc(s.id, s.data()!) : null
  }

  async setFlag(reviewId: string, flag: ReviewFlag): Promise<boolean> {
    const ref = this.collection.doc(reviewId)
    return this.db.runTransaction(async (tx) => {
      const d = await tx.get(ref)
      if (!d.exists || d.get("status") !== "published") return false
      tx.update(ref, { status: "flagged", flag, updatedAt: new Date() })
      return true
    })
  }

  async countOpenFlags(filter: { by?: string; activityId?: string }): Promise<number> {
    let q = this.collection.where("status", "==", "flagged")
    if (filter.by) q = q.where("flag.by", "==", filter.by)
    if (filter.activityId) q = q.where("activityId", "==", filter.activityId)
    return (await q.count().get()).data().count
  }

  async resolveFlag(reviewId: string, r: { status: "published" | "removed"; resolution: "upheld" | "removed"; resolvedBy: string; at: Date }): Promise<{ review: ActivityReview; rating: ActivityRating } | null> {
    const ref = this.collection.doc(reviewId)
    return this.db.runTransaction(async (tx) => {
      const d = await tx.get(ref)
      if (!d.exists || d.get("status") !== "flagged") return null
      const ts = this.targets(d.get("activityId"), d.get("siteId"))
      const snaps = await this.readAll(tx, ts)
      let rating: ActivityRating = (snaps[0].exists ? snaps[0].get("rating") : null) ?? EMPTY
      tx.update(ref, { status: r.status, "flag.resolution": r.resolution, "flag.resolvedAt": r.at, "flag.resolvedBy": r.resolvedBy, updatedAt: r.at })
      if (r.status === "removed") rating = this.applyAll(tx, ts, snaps, { type: "remove", rating: d.get("rating") })
      const data = { ...d.data()!, status: r.status, flag: { ...d.get("flag"), resolution: r.resolution, resolvedAt: r.at, resolvedBy: r.resolvedBy } }
      return { review: fromDoc(d.id, data), rating }
    })
  }

  async setReply(reviewId: string, reply: { text: string; at: Date } | null): Promise<void> {
    await this.collection.doc(reviewId).update({ ownerReply: reply, updatedAt: new Date() })
  }

  async listFlagged(limit: number): Promise<ActivityReview[]> {
    const s = await this.collection.where("status", "==", "flagged").limit(500).get()
    return s.docs.map((d) => fromDoc(d.id, d.data())).sort((a, b) => (a.flag?.at.getTime() ?? 0) - (b.flag?.at.getTime() ?? 0)).slice(0, limit)
  }

  async anonymize(activityId: string, uid: string): Promise<{ path: string; thumbnailPath?: string }[]> {
    const ref = this.collection.doc(reviewId(activityId, uid))
    return this.db.runTransaction(async (tx) => {
      const d = await tx.get(ref)
      if (!d.exists) return []
      const media = (d.get("media") ?? []).map((m: { path: string; thumbnailPath?: string }) => ({ path: m.path, thumbnailPath: m.thumbnailPath }))
      tx.update(ref, { "author.displayName": "Usuario eliminado", "author.photoURL": "", media: [], updatedAt: new Date() })
      return media
    })
  }

  async restoreRemoved(reviewId: string): Promise<{ review: ActivityReview; rating: ActivityRating } | null> {
    const ref = this.collection.doc(reviewId)
    return this.db.runTransaction(async (tx) => {
      const d = await tx.get(ref)
      if (!d.exists || d.get("status") !== "removed") return null
      const ts = this.targets(d.get("activityId"), d.get("siteId"))
      const snaps = await this.readAll(tx, ts)
      const rating = this.applyAll(tx, ts, snaps, { type: "add", rating: d.get("rating") })
      tx.update(ref, { status: "published", updatedAt: new Date() })
      return { review: fromDoc(d.id, { ...d.data()!, status: "published" }), rating }
    })
  }
}
