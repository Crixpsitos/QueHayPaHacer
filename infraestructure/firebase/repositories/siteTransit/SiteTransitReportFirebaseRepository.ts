import type { Firestore } from "firebase-admin/firestore"
import { FirebaseBaseRepository } from "../FirebaseBaseRepository"
import type { ISiteTransitReportRepository } from "@/domain/repository/siteTransit/ISiteTransitReportRepository"

// ponytail: sin adapter/mapper; solo Admin SDK (las reglas niegan todo acceso de cliente).
export class SiteTransitReportFirebaseRepository extends FirebaseBaseRepository implements ISiteTransitReportRepository {
  protected readonly collectionName = "siteTransitReports"

  constructor(db: Firestore) {
    super(db)
  }

  async getAt(siteId: string, uid: string): Promise<number | null> {
    const snap = await this.collection.doc(`${siteId}_${uid}`).get()
    return snap.exists ? ((snap.get("at") as number | undefined) ?? null) : null
  }

  async save(siteId: string, uid: string, at: number): Promise<void> {
    await this.collection.doc(`${siteId}_${uid}`).set({ siteId, uid, at })
  }

  async listBySite(siteId: string) {
    // Una sola igualdad: sin índice compuesto.
    const snap = await this.collection.where("siteId", "==", siteId).select("uid", "at").get()
    return snap.docs.map((d) => ({ uid: d.get("uid") as string, at: d.get("at") as number }))
  }
}
