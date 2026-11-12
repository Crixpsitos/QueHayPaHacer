import type { Firestore } from "firebase-admin/firestore"
import type { ActivityAppeal, IActivityAppealRepository } from "@/domain/repository/activities/IActivityAppealRepository"
import { FirebaseBaseRepository } from "../FirebaseBaseRepository"

const ALREADY_EXISTS = 6
const toDate = (v: unknown): Date => (v && typeof (v as { toDate?: unknown }).toDate === "function" ? (v as { toDate: () => Date }).toDate() : v instanceof Date ? v : new Date(0))
const from = (id: string, d: FirebaseFirestore.DocumentData): ActivityAppeal => ({ reviewId: id, uid: d.uid, explanation: d.explanation, status: d.status, createdAt: toDate(d.createdAt), resolvedAt: d.resolvedAt ? toDate(d.resolvedAt) : undefined, resolvedBy: d.resolvedBy })

/** `activityAppeals/{reviewId}`: crear falla si ya existe → una apelación por reseña. Solo el servidor escribe. */
export class ActivityAppealFirebaseRepository extends FirebaseBaseRepository implements IActivityAppealRepository {
  protected readonly collectionName = "activityAppeals"
  constructor(db: Firestore) { super(db) }

  async create(a: ActivityAppeal): Promise<boolean> {
    try { await this.collection.doc(a.reviewId).create({ ...a }); return true } catch (e) { if ((e as { code?: number }).code === ALREADY_EXISTS) return false; throw e }
  }
  async get(reviewId: string) { const s = await this.collection.doc(reviewId).get(); return s.exists ? from(s.id, s.data()!) : null }
  async listOpen(limit: number) {
    const s = await this.collection.where("status", "==", "open").limit(500).get()
    return s.docs.map((d) => from(d.id, d.data())).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).slice(0, limit)
  }
  async resolve(reviewId: string, status: "restored" | "rejected", by: string, at: Date): Promise<boolean> {
    const ref = this.collection.doc(reviewId)
    return this.db.runTransaction(async (tx) => { const d = await tx.get(ref); if (!d.exists || d.get("status") !== "open") return false; tx.update(ref, { status, resolvedBy: by, resolvedAt: at }); return true })
  }
}
