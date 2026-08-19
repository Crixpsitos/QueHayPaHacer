"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel";
import type { SiteCategory } from "@/presentation/sites/view-models/SiteFormViewModel";

interface LoadMoreSitesResult {
  sites: SiteDetail[];
  nextCursor: string | null;
}

export async function loadMoreExploreSitesAction(
  category: SiteCategory,
  cursor: string,
): Promise<LoadMoreSitesResult> {
  const { sitesService } = createServerContainer();
  const { ids, nextCursor } = await sitesService.getSitesByCategory(category, 8, cursor);
  const details = await Promise.all(ids.map((id) => sitesService.getSiteDetailById(id)));
  const sites = details.filter((s): s is SiteDetail => Boolean(s));
  return { sites, nextCursor };
}
