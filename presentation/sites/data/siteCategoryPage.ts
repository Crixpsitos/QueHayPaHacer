import { cacheLife, cacheTag } from "next/cache";
import { createServerContainer } from "@/infraestructure/di/container";
import { fetchSiteDetailById } from "./siteFetchers";
import type { SiteDetail } from "../view-models/SiteFormViewModel";

export const SITE_PAGE_SIZE = 12;

/** IDs de una página de un tipo de sitio, por cursor. Cacheado (tag site-list). */
const fetchSiteIdsByCategory = async (
  category: string,
  cursor: string | null,
  limit: number,
): Promise<{ ids: string[]; nextCursor: string | null }> => {
  "use cache";
  cacheLife("hours");
  cacheTag("site-list", `site-type-${category}`);
  const { sitesService } = createServerContainer();
  return sitesService.getSitesByCategory(category, limit, cursor);
};

/** Una página de sitios de un tipo, con cursor para la siguiente. */
export async function getSiteCategoryPage(
  category: string,
  cursor: string | null,
  limit: number = SITE_PAGE_SIZE,
): Promise<{ sites: SiteDetail[]; nextCursor: string | null }> {
  const { ids, nextCursor } = await fetchSiteIdsByCategory(category, cursor, limit);
  const sites = (await Promise.all(ids.map(fetchSiteDetailById))).filter(
    (s): s is SiteDetail => Boolean(s),
  );
  return { sites, nextCursor };
}
