import { cacheLife, cacheTag } from "next/cache";
import { createServerContainer } from "@/infraestructure/di/container";
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel";
import { SiteDiscoveryGrid } from "@/presentation/sites/components/discovery/SiteDiscovery";

const HOME_SITES_LIMIT = 4;

const fetchSiteDetail = async (id: string): Promise<SiteDetail | null> => {
  "use cache";
  cacheLife("weeks");
  cacheTag(`site-${id}`);
  const { sitesService } = createServerContainer();
  return sitesService.getSiteDetailById(id);
};

const fetchHomeSites = async (): Promise<SiteDetail[]> => {
  "use cache";
  cacheLife("days");
  cacheTag("site-list", "featured-sites");
  const { sitesService } = createServerContainer();
  const ids = await sitesService.getFeaturedSites();
  const sites = await Promise.all(ids.slice(0, HOME_SITES_LIMIT).map(fetchSiteDetail));
  return sites.filter((s): s is SiteDetail => Boolean(s));
};

export async function HomeSitesContainer() {
  const sites = await fetchHomeSites();
  if (sites.length === 0) return null;

  return <SiteDiscoveryGrid sites={sites} showTrending />;
}
