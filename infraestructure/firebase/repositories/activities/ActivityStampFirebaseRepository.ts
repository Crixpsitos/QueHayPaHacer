import type { Firestore } from "firebase-admin/firestore"
import type { IActivityStampRepository, Stamp } from "@/domain/repository/activities/IActivityStampRepository"
import { FirebaseBaseRepository } from "../FirebaseBaseRepository"

const toDate = (v: unknown): Date => (v && typeof (v as { toDate?: unknown }).toDate === "function" ? (v as { toDate: () => Date }).toDate() : v instanceof Date ? v : new Date(0))

/** Sellos privados (`users/{uid}/stamps/{activityId}`) y código del QR (`activities/{id}/private/stamp`). Solo Admin SDK. */
export class ActivityStampFirebaseRepository extends FirebaseBaseRepository implements IActivityStampRepository {
  protected readonly collectionName = "activities"
  constructor(db: Firestore) { super(db) }

  private tokenRef(activityId: string) { return this.collection.doc(activityId).collection("private").doc("stamp") }
  private stamps(uid: string) { return this.db.collection("users").doc(uid).collection("stamps") }

  async getToken(activityId: string): Promise<string | null> {
    const s = await this.tokenRef(activityId).get()
    return s.exists ? (s.get("token") as string) : null
  }
  async ensureToken(activityId: string, candidate: string): Promise<string> {
    const ref = this.tokenRef(activityId)
    return this.db.runTransaction(async (tx) => { const s = await tx.get(ref); if (s.exists) return s.get("token") as string; tx.set(ref, { token: candidate, createdAt: new Date() }); return candidate })
  }
  async collect(uid: string, stamp: Stamp): Promise<{ created: boolean }> {
    const ref = this.stamps(uid).doc(stamp.activityId)
    return this.db.runTransaction(async (tx) => { const s = await tx.get(ref); if (s.exists) return { created: false }; tx.set(ref, { activityId: stamp.activityId, at: stamp.at, day: stamp.day }); return { created: true } })
  }
  async countOnDay(uid: string, day: string): Promise<number> { return (await this.stamps(uid).where("day", "==", day).count().get()).data().count }
  async listMine(uid: string, limit: number): Promise<Stamp[]> {
    const s = await this.stamps(uid).limit(500).get()
    return s.docs.map((d) => ({ activityId: d.get("activityId") as string, at: toDate(d.get("at")), day: d.get("day") as string })).sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit)
  }
}
