"use server";

import { getSiteCategoryPage } from "@/presentation/sites/data/siteCategoryPage";
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel";

/** "Cargar más" de una landing de tipo de sitio. Sin datos por-usuario. */
export async function loadMoreSitesAction(
  category: string,
  cursor: string | null,
): Promise<{ sites: SiteDetail[]; nextCursor: string | null }> {
  return getSiteCategoryPage(category, cursor);
}
