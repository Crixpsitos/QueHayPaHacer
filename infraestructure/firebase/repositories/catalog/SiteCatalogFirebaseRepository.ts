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

  async listWithPromotions(): Promise<SiteCatalog[]> {
    // ponytail: lee todas las cartas (pocas) y filtra en memoria; con cientos de sitios, desnormalizar un `hasPromotions`.
    const snap = await this.db.collection("siteCatalogs").select("promotions").limit(500).get()
    return snap.docs.filter((d) => Array.isArray(d.get("promotions")) && d.get("promotions").length).map((d) => ({ siteId: d.id, whatsapp: "", reservePhone: "", products: [], promotions: d.get("promotions") }))
  }

  async save(siteId: string, c: SiteCatalog, savedBy: string): Promise<void> {
    await this.doc(siteId).set({ whatsapp: c.whatsapp, reservePhone: c.reservePhone, products: c.products, promotions: c.promotions, savedBy, updatedAt: FieldValue.serverTimestamp() })
  }
}
