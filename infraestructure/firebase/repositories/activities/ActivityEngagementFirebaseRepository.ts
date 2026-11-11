import { FieldValue, type Firestore } from "firebase-admin/firestore"
import type { IActivityEngagementRepository } from "@/domain/repository/activities/IActivityEngagementRepository"
import { FirebaseBaseRepository } from "../FirebaseBaseRepository"

/**
 * Guardados (`users/{uid}/saved/activity_{id}`, privados) y visitas (`activities/{id}/visits/{uid}`).
 * Cada cambio y su contador agregado van en UNA transacción: doble toque o dos pestañas = un solo cambio.
 */
export class ActivityEngagementFirebaseRepository extends FirebaseBaseRepository implements IActivityEngagementRepository {
  protected readonly collectionName = "activities"

  constructor(db: Firestore) {
    super(db)
  }

  private savedRef(uid: string, activityId: string) {
    return this.db.collection("users").doc(uid).collection("saved").doc(`activity_${activityId}`)
  }

  async setSaved(uid: string, activityId: string, saved: boolean): Promise<{ changed: boolean }> {
    const ref = this.savedRef(uid, activityId)
    const activity = this.collection.doc(activityId)
    return this.db.runTransaction(async (tx) => {
      const exists = (await tx.get(ref)).exists
      if (exists === saved) return { changed: false }
      if (saved) {
        tx.set(ref, { type: "activity", targetId: activityId, savedAt: FieldValue.serverTimestamp() })
        tx.update(activity, { "analytics.saves": FieldValue.increment(1) })
      } else {
        tx.delete(ref)
        tx.update(activity, { "analytics.saves": FieldValue.increment(-1) })
      }
      return { changed: true }
    })
  }

  async savedAmong(uid: string, activityIds: string[]): Promise<string[]> {
    const refs = activityIds.slice(0, 100).map((id) => this.savedRef(uid, id))
    const snaps = await this.db.getAll(...refs)
    return snaps.filter((s) => s.exists).map((s) => String(s.get("targetId")))
  }

  async markVisited(uid: string, activityId: string): Promise<{ changed: boolean }> {
    const activity = this.collection.doc(activityId)
    const ref = activity.collection("visits").doc(uid)
    return this.db.runTransaction(async (tx) => {
      if ((await tx.get(ref)).exists) return { changed: false }
      tx.set(ref, { visitedAt: FieldValue.serverTimestamp() })
      tx.update(activity, { "analytics.visits": FieldValue.increment(1) })
      return { changed: true }
    })
  }

  async hasVisited(uid: string, activityId: string): Promise<boolean> {
    return (await this.collection.doc(activityId).collection("visits").doc(uid).get()).exists
  }
}
