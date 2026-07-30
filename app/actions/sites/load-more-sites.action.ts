"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel";

/** "Cargar más" de una landing de tipo de sitio. Sin datos por-usuario. */
export async function loadMoreSitesAction(
  category: string,
  cursor: string | null,
): Promise<{ sites: SiteDetail[]; nextCursor: string | null }> {
  const { sitesService } = createServerContainer();
  const { ids, nextCursor } = await sitesService.getSitesByCategory(category, 12, cursor);
  const details = await Promise.all(ids.map((id) => sitesService.getSiteDetailById(id)));
  const sites = details.filter((s): s is SiteDetail => Boolean(s));
  return { sites, nextCursor };
}
