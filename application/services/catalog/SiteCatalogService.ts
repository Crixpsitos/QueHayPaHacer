import { isCatalogPromoCurrent } from "@/domain/entities/catalog/CatalogPromotion"
import { emptyCatalog, normalizeCatalog, validateCatalog, type SiteCatalog } from "@/domain/entities/catalog/SiteCatalog"
import type { ISiteCatalogRepository } from "@/domain/repository/catalog/ISiteCatalogRepository"

export interface CatalogDeps {
  repo: ISiteCatalogRepository
  isOwner: (uid: string, siteId: string) => Promise<boolean>
  clock: () => Date
}

export type SaveCatalogResult = { ok: true; catalog: SiteCatalog } | { ok: false; error: string }

/** Carta y promociones de un sitio. Solo quien es dueño del sitio la edita; cualquiera la lee. */
export class SiteCatalogService {
  constructor(private readonly d: CatalogDeps) {}

  /** Lectura pública (la carta vacía si el sitio no tiene). */
  async get(siteId: string): Promise<SiteCatalog> {
    return (await this.d.repo.get(siteId)) ?? emptyCatalog(siteId)
  }

  /** Ids de las actividades que alguna promoción vigente (sin pausar y dentro de sus fechas) eligió. */
  async promoActivityIds(): Promise<string[]> {
    const now = this.d.clock()
    const ids = new Set<string>()
    for (const c of await this.d.repo.listWithPromotions()) for (const x of c.promotions) if (isCatalogPromoCurrent(x, now)) x.activityIds.forEach((id) => ids.add(id))
    return [...ids]
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
