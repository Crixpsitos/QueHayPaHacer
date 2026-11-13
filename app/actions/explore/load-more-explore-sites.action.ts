"use server";

import { fetchSitesMore } from "@/presentation/sites/data/siteListFetchers";
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel";
import type { SiteCategory } from "@/presentation/sites/view-models/SiteFormViewModel";

interface LoadMoreSitesResult {
  sites: SiteDetail[];
  nextCursor: string | null;
}

/** «Cargar más» de Explorar por tipo: cacheado por (tipo, cursor), detalles de `fetchSiteDetailById`. */
export async function loadMoreExploreSitesAction(
  category: SiteCategory,
  cursor: string,
): Promise<LoadMoreSitesResult> {
  if (typeof category !== "string" || !category || category.length > 40 || typeof cursor !== "string" || cursor.length > 200) return { sites: [], nextCursor: null };
  return fetchSitesMore(category, cursor, 8);
}
