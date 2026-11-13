"use server";

import { fetchSitesMore, SITES_PAGE_SIZE } from "@/presentation/sites/data/siteListFetchers";
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel";

/** "Cargar más" de un tipo de sitio, o de todos con `category = "all"`. Sin datos por-usuario (cacheado: ver `fetchSitesMore`). */
export async function loadMoreSitesAction(
  category: string,
  cursor: string | null,
): Promise<{ sites: SiteDetail[]; nextCursor: string | null }> {
  if (typeof category !== "string" || !category || category.length > 40) return { sites: [], nextCursor: null };
  if (cursor !== null && (typeof cursor !== "string" || cursor.length > 200)) return { sites: [], nextCursor: null };
  return fetchSitesMore(category, cursor, SITES_PAGE_SIZE);
}
