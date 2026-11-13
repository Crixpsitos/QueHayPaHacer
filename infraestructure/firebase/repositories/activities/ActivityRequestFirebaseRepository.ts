import { Timestamp, type Firestore } from "firebase-admin/firestore"
import type { ActivityRequestRow, IActivityRequestRepository } from "@/domain/repository/activities/IActivityRequestRepository"
import { requestDocId } from "@/domain/entities/activities/activityRequest"

export class ActivityRequestFirebaseRepository implements IActivityRequestRepository {
  constructor(private readonly db: Firestore) {}
  private col(activityId: string) { return this.db.collection("activities").doc(activityId).collection("requests") }

  async put(activityId: string, row: ActivityRequestRow, ttlMs: number, now: number): Promise<boolean> {
    const ref = this.col(activityId).doc(requestDocId(row.key, row.uid))
    return this.db.runTransaction(async (tx) => {
      const s = await tx.get(ref)
      const prev = (s.get("createdAt") as Timestamp | undefined)?.toMillis()
      if (s.exists && prev !== undefined && now - prev <= ttlMs) return false
      tx.set(ref, { key: row.key, uid: row.uid, name: row.name, extras: row.extras, createdAt: Timestamp.fromMillis(row.createdAt) })
      return true
    })
  }

  async list(activityId: string, limit: number): Promise<ActivityRequestRow[]> {
    const snap = await this.col(activityId).orderBy("createdAt", "desc").limit(limit).get()
    return snap.docs.map((d) => ({ key: d.get("key") as string, uid: d.get("uid") as string, name: d.get("name") as string, createdAt: (d.get("createdAt") as Timestamp).toMillis(), extras: Array.isArray(d.get("extras")) ? d.get("extras") : [] }))
  }

  async get(activityId: string, key: string, uid: string): Promise<ActivityRequestRow | null> {
    const d = await this.col(activityId).doc(requestDocId(key, uid)).get()
    if (!d.exists) return null
    return { key: d.get("key") as string, uid: d.get("uid") as string, name: d.get("name") as string, createdAt: (d.get("createdAt") as Timestamp).toMillis(), extras: Array.isArray(d.get("extras")) ? d.get("extras") : [] }
  }

  async remove(activityId: string, key: string, uid: string): Promise<void> {
    await this.col(activityId).doc(requestDocId(key, uid)).delete()
  }
}
