import { FieldValue, type Firestore } from "firebase-admin/firestore"
import type { SiteCatalog } from "@/domain/entities/catalog/SiteCatalog"
import type { ISiteCatalogRepository } from "@/domain/repository/catalog/ISiteCatalogRepository"

export class SiteCatalogFirebaseRepository implements ISiteCatalogRepository {
  constructor(private readonly db: Firestore) {}
  private doc(siteId: string) { return this.db.collection("siteCatalogs").doc(siteId) }

  async get(siteId: string): Promise<SiteCatalog | null> {
    const s = await this.doc(siteId).get()
    if (!s.exists) return null
    const d = s.data()!
    return { siteId, whatsapp: d.whatsapp ?? "", reservePhone: d.reservePhone ?? "", products: d.products ?? [], promotions: d.promotions ?? [] }
  }

  async save(siteId: string, c: SiteCatalog, savedBy: string): Promise<void> {
    await this.doc(siteId).set({ whatsapp: c.whatsapp, reservePhone: c.reservePhone, products: c.products, promotions: c.promotions, savedBy, updatedAt: FieldValue.serverTimestamp() })
  }
}
