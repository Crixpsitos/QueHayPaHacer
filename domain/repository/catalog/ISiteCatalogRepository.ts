import type { SiteCatalog } from "@/domain/entities/catalog/SiteCatalog"

/** Un documento por sitio: `siteCatalogs/{siteId}` (solo Admin SDK). */
export interface ISiteCatalogRepository {
  /** null si el sitio aún no tiene carta. */
  get(siteId: string): Promise<SiteCatalog | null>
  save(siteId: string, catalog: SiteCatalog, savedBy: string): Promise<void>
}
