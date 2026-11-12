import type { DocumentData, Firestore } from "firebase-admin/firestore"
import type { ActivityRating } from "@/domain/entities/activities/Activity"
import { applyReviewToRating, type ActivityReview } from "@/domain/entities/activities/review/ActivityReview"
import type { IActivityReviewRepository } from "@/domain/repository/activities/IActivityReviewRepository"
import { FirebaseBaseRepository } from "../FirebaseBaseRepository"

const EMPTY: ActivityRating = { count: 0, sum: 0, avg: 0, dist: [0, 0, 0, 0, 0] }
const toDate = (v: unknown): Date => (v && typeof (v as { toDate?: unknown }).toDate === "function" ? (v as { toDate: () => Date }).toDate() : v instanceof Date ? v : new Date(0))
const toDateOrNull = (v: unknown): Date | null => (v ? toDate(v) : null)

function fromDoc(id: string, d: DocumentData): ActivityReview {
  return {
    id, activityId: d.activityId, uid: d.uid, rating: d.rating, title: d.title ?? "", body: d.body ?? "", visitedAt: d.visitedAt,
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

  async get(activityId: string, uid: string): Promise<ActivityReview | null> {
    const s = await this.collection.doc(`${activityId}_${uid}`).get()
    return s.exists ? fromDoc(s.id, s.data()!) : null
  }

  async save(review: ActivityReview): Promise<{ created: boolean; rating: ActivityRating }> {
    const ref = this.collection.doc(review.id)
    const act = this.activity(review.activityId)
    return this.db.runTransaction(async (tx) => {
      const [mine, a] = await Promise.all([tx.get(ref), tx.get(act)])
      if (!a.exists) throw new Error("Esa actividad no existe.")
      const current: ActivityRating = a.get("rating") ?? EMPTY
      const created = !mine.exists
      const rating = applyReviewToRating(current, created ? { type: "add", rating: review.rating } : { type: "edit", from: mine.get("rating"), to: review.rating })
      tx.set(ref, { ...review, flag: review.flag ?? null, ownerReply: review.ownerReply ?? null, editedAt: review.editedAt ?? null })
      tx.update(act, { rating, "analytics.reviews": rating.count })
      return { created, rating }
    })
  }

  async remove(activityId: string, uid: string): Promise<{ removed: boolean; rating: ActivityRating }> {
    const ref = this.collection.doc(`${activityId}_${uid}`)
    const act = this.activity(activityId)
    return this.db.runTransaction(async (tx) => {
      const [mine, a] = await Promise.all([tx.get(ref), tx.get(act)])
      const current: ActivityRating = (a.exists ? a.get("rating") : null) ?? EMPTY
      if (!mine.exists) return { removed: false, rating: current }
      if (mine.get("status") === "flagged") throw new Error("FLAGGED")
      const rating = applyReviewToRating(current, { type: "remove", rating: mine.get("rating") })
      tx.delete(ref)
      if (a.exists) tx.update(act, { rating, "analytics.reviews": rating.count })
      return { removed: true, rating }
    })
  }

  // Sin orderBy: evita un índice compuesto. El volumen por actividad/persona es pequeño y se corta aquí.
  async listByActivity(activityId: string, limit: number): Promise<ActivityReview[]> {
    const s = await this.collection.where("activityId", "==", activityId).limit(500).get()
    return s.docs.map((d) => fromDoc(d.id, d.data())).filter((r) => r.status === "published" || r.status === "flagged").sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit)
  }

  async listByAuthorSince(uid: string, since: Date): Promise<ActivityReview[]> {
    const s = await this.collection.where("uid", "==", uid).limit(200).get()
    return s.docs.map((d) => fromDoc(d.id, d.data())).filter((r) => r.createdAt >= since)
  }
}
