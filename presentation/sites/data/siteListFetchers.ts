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

/** Primera página de TODOS los sitios públicos; las siguientes salen de `loadMoreSitesAction("all", cursor)`. */
export const fetchAllSitesPage = async (): Promise<{ sites: SiteDetail[]; nextCursor: string | null }> => {
  "use cache"
  cacheLife("days")
  cacheTag("site-list", "site-collection-all")
  const { ids, nextCursor } = await createServerContainer().sitesService.getAllSitesPage(SITES_PAGE_SIZE, null)
  return { sites: present(await Promise.all(ids.map(fetchSiteDetailById))), nextCursor }
}
