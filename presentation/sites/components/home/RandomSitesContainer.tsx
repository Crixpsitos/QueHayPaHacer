import { cacheLife, cacheTag } from "next/cache";
import { createServerContainer } from "@/infraestructure/di/container";
import { ContentSection } from "@/app/components/layout/shared/ContentSection";
import { Separator } from "@/app/components/ui/separator";
import { SiteDiscoveryGrid } from "@/presentation/sites/components/discovery/SiteDiscovery";
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel";

const RANDOM_SITES_LIMIT = 4;

const fetchSiteDetail = async (id: string): Promise<SiteDetail | null> => {
  "use cache";
  cacheLife("weeks");
  cacheTag(`site-${id}`);
  const { sitesService } = createServerContainer();
  return sitesService.getSiteDetailById(id);
};

export async function RandomSitesContainer() {
  const { sitesService } = createServerContainer();
  const ids = await sitesService.getRandomSites(RANDOM_SITES_LIMIT);
  const sites = (await Promise.all(ids.map(fetchSiteDetail))).filter(
    (site): site is SiteDetail => Boolean(site),
  );

  if (sites.length === 0) return null;

  return (
    <ContentSection title="Lugares para descubrir" action={{ href: "/donde-ir" }}>
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Una selección diferente de sitios para explorar en la ciudad.
      </p>
      <Separator className="my-6" />
      <SiteDiscoveryGrid sites={sites} />
    </ContentSection>
  );
}