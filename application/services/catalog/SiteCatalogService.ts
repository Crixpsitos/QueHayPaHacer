import { isCatalogPromoCurrent } from "@/domain/entities/catalog/CatalogPromotion"
import { emptyCatalog, normalizeCatalog, validateCatalog, type SiteCatalog } from "@/domain/entities/catalog/SiteCatalog"
import type { ISiteCatalogRepository } from "@/domain/repository/catalog/ISiteCatalogRepository"

export interface CatalogDeps {
  repo: ISiteCatalogRepository
  isOwner: (uid: string, siteId: string) => Promise<boolean>
  clock: () => Date
  /** Celular (10 dígitos) que el sitio ya tiene en su botón de pedidos, para no pedirlo dos veces. */
  siteContact?: (siteId: string) => Promise<string>
}

export type SaveCatalogResult = { ok: true; catalog: SiteCatalog } | { ok: false; error: string }

/** Carta y promociones de un sitio. Solo quien es dueño del sitio la edita; cualquiera la lee. */
export class SiteCatalogService {
  constructor(private readonly d: CatalogDeps) {}

  /** Lectura pública (la carta vacía si el sitio no tiene). */
  async get(siteId: string): Promise<SiteCatalog> {
    const c = (await this.d.repo.get(siteId)) ?? emptyCatalog(siteId)
    if (c.whatsapp && c.reservePhone) return c
    // Sin número propio en la carta se usa el del sitio; el dueño lo cambia cuando quiera.
    const fallback = (await this.d.siteContact?.(siteId)) ?? ""
    return { ...c, whatsapp: c.whatsapp || fallback, reservePhone: c.reservePhone || fallback }
  }

  /** Ids de las actividades que alguna promoción vigente (sin pausar y dentro de sus fechas) eligió. */
  async promoActivityIds(): Promise<string[]> {
    const now = this.d.clock()
    const ids = new Set<string>()
    for (const c of await this.d.repo.listWithPromotions()) for (const x of c.promotions) if (isCatalogPromoCurrent(x, now)) x.activityIds.forEach((id) => ids.add(id))
    return [...ids]
  }

  /** Sitio → título de su primera promoción vigente (sin pausar y dentro de sus fechas). Para la guía de sitios. */
  async currentPromoBySite(): Promise<Record<string, string>> {
    const now = this.d.clock()
    const out: Record<string, string> = {}
    for (const c of await this.d.repo.listWithPromotions()) {
      const x = c.promotions.find((p) => isCatalogPromoCurrent(p, now))
      if (x) out[c.siteId] = x.title
    }
    return out
  }

  /** Para el panel del dueño. null si no es suyo. */
  async getForOwner(uid: string, siteId: string): Promise<SiteCatalog | null> {
    if (!(await this.d.isOwner(uid, siteId))) return null
    return this.get(siteId)
  }

  async save(uid: string, siteId: string, input: SiteCatalog): Promise<SaveCatalogResult> {
    if (!(await this.d.isOwner(uid, siteId))) return { ok: false, error: "Este sitio no es tuyo." }
    const catalog = normalizeCatalog({ ...input, siteId })
    const error = validateCatalog(catalog, this.d.clock())
    if (error) return { ok: false, error }
    await this.d.repo.save(siteId, catalog, uid)
    return { ok: true, catalog }
  }
}
