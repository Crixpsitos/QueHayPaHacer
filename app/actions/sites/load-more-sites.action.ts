"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel";

/** "Cargar más" de un tipo de sitio, o de todos con `category = "all"`. Sin datos por-usuario. */
export async function loadMoreSitesAction(
  category: string,
  cursor: string | null,
): Promise<{ sites: SiteDetail[]; nextCursor: string | null }> {
  if (typeof category !== "string" || !category || category.length > 40) return { sites: [], nextCursor: null };
  const { sitesService } = createServerContainer();
  const { ids, nextCursor } =
    category === "all"
      ? await sitesService.getAllSitesPage(12, cursor)
      : await sitesService.getSitesByCategory(category, 12, cursor);
  const details = await Promise.all(ids.map((id) => sitesService.getSiteDetailById(id)));
  const sites = details.filter((s): s is SiteDetail => Boolean(s));
  return { sites, nextCursor };
}
