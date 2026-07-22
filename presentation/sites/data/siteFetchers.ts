import { cacheLife, cacheTag } from "next/cache";
import { createServerContainer } from "@/infraestructure/di/container";
import type { SiteCollectionDef } from "../lib/siteCollections";
import type { SiteDetail } from "../view-models/SiteFormViewModel";

/** Detalle de un sitio (read-model). Cacheado por id. */
export const fetchSiteDetailById = async (id: string): Promise<SiteDetail | null> => {
  "use cache";
  cacheLife("weeks");
  cacheTag(`site-${id}`);
  const { sitesService } = createServerContainer();
  return sitesService.getSiteDetailById(id);
};

/** IDs de una colección featured/all (el tipo va paginado en siteCategoryPage). */
const fetchCollectionSiteIds = async (
  slug: string,
  kind: SiteCollectionDef["kind"],
): Promise<string[]> => {
  "use cache";
  cacheLife("hours");
  cacheTag("site-list", `site-collection-${slug}`);
  const { sitesService } = createServerContainer();
  if (kind === "featured") return sitesService.getFeaturedSites();
  return sitesService.getAllSites();
};

/** Sitios (detalle) de una colección featured/all. */
export async function fetchCollectionSites(def: SiteCollectionDef): Promise<SiteDetail[]> {
  const ids = await fetchCollectionSiteIds(def.slug, def.kind);
  const sites = await Promise.all(ids.map(fetchSiteDetailById));
  return sites.filter((s): s is SiteDetail => Boolean(s));
}
