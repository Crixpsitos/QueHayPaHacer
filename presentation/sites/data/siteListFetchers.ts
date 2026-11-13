import { cacheLife, cacheTag } from "next/cache"
import { createServerContainer } from "@/infraestructure/di/container"
import type { SiteDetail } from "../view-models/SiteFormViewModel"

/** Lecturas cacheadas de los listados públicos de sitios (índice /donde-ir y landings). */
export const SITES_PAGE_SIZE = 12

export const fetchSiteDetailById = async (id: string): Promise<SiteDetail | null> => {
  "use cache"
  cacheLife("weeks")
  cacheTag(`site-${id}`)
  return createServerContainer().sitesService.getSiteDetailById(id)
}

const present = (sites: (SiteDetail | null)[]) => sites.filter((s): s is SiteDetail => Boolean(s))

/** Los mejor puntuados (ver siteRanking), sin umbral mínimo. */
export const fetchFeaturedSites = async (): Promise<SiteDetail[]> => {
  "use cache"
  cacheLife("days")
  cacheTag("site-list", "site-collection-featured")
  const ids = await createServerContainer().sitesService.getFeaturedSites()
  return present(await Promise.all(ids.map(fetchSiteDetailById)))
}

/**
 * Primera página de TODOS los sitios públicos; las siguientes salen de `loadMoreSitesAction("all", cursor)`.
 * En el índice se pide más (los destacados salen de los primeros y se ocultan de esta lista).
 */
export const fetchAllSitesPage = async (size: number = SITES_PAGE_SIZE): Promise<{ sites: SiteDetail[]; nextCursor: string | null }> => {
  "use cache"
  cacheLife("days")
  cacheTag("site-list", "site-collection-all")
  const { ids, nextCursor } = await createServerContainer().sitesService.getAllSitesPage(size, null)
  return { sites: present(await Promise.all(ids.map(fetchSiteDetailById))), nextCursor }
}

/**
 * Página siguiente de «Cargar más» (todos o por tipo), con detalles. Cacheada por (tipo, cursor): antes cada clic leía
 * la consulta y un documento por sitio; ahora los detalles salen de `fetchSiteDetailById` y la página de la caché.
 * Se invalida con `site-list` (publicar/editar/dar de baja) y con `site-<id>` por detalle.
 */
export const fetchSitesMore = async (category: string, cursor: string | null, size: number): Promise<{ sites: SiteDetail[]; nextCursor: string | null }> => {
  "use cache"
  cacheLife("days")
  cacheTag("site-list")
  const { sitesService } = createServerContainer()
  const { ids, nextCursor } = category === "all" ? await sitesService.getAllSitesPage(size, cursor) : await sitesService.getSitesByCategory(category, size, cursor)
  return { sites: present(await Promise.all(ids.map(fetchSiteDetailById))), nextCursor }
}
