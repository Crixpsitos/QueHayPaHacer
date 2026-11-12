import type { Firestore } from "firebase-admin/firestore"
import type { IPlanExtrasRepository } from "@/domain/repository/activities/IPlanExtrasRepository"

/** `users/{uid}/eventInteractions` (liked) y `users/{uid}/likedSites`: proyecciones por persona, una lectura cada una. */
export class PlanExtrasFirebaseRepository implements IPlanExtrasRepository {
  constructor(private readonly db: Firestore) {}

  async likedEventIds(uid: string, limit: number): Promise<string[]> {
    const s = await this.db.collection("users").doc(uid).collection("eventInteractions").where("liked", "==", true).limit(limit).get()
    return s.docs.map((d) => (d.get("eventId") as string) || d.id)
  }

  async likedSiteIds(uid: string, limit: number): Promise<string[]> {
    const s = await this.db.collection("users").doc(uid).collection("likedSites").limit(limit).get()
    return s.docs.map((d) => d.id)
  }
}
