import { Section } from "@/app/components/layout/shared/Section";
import { ContentSection } from "@/app/components/layout/shared/ContentSection";
import { SiteDiscoveryGrid } from "./SiteDiscovery";
import { InfiniteSiteList } from "./InfiniteSiteList";
import { fetchAllSitesPage } from "../../data/siteListFetchers";
import { getSiteCollections, type SiteCollectionDef } from "../../lib/siteCollections";
import { groupSitesByCategory } from "../../lib/groupSitesByCategory";
import { createServerContainer } from "@/infraestructure/di/container";
import { cacheLife, cacheTag } from "next/cache";
import type { SiteDetail } from "../../view-models/SiteFormViewModel";
import { fetchAllSiteIds } from "@/presentation/sites/data/fetchAllSiteIds"

const fetchSiteDetailById = async (id: string): Promise<SiteDetail | null> => {
  "use cache";
  cacheLife("weeks");
  cacheTag(`site-${id}`);
  const { sitesService } = createServerContainer();
  return sitesService.getSiteDetailById(id);
};

const fetchCollectionSites = async (def: SiteCollectionDef): Promise<SiteDetail[]> => {
  "use cache";
  cacheLife("days");
  cacheTag("site-list", `site-collection-${def.slug}`);
  const { sitesService } = createServerContainer();
  const ids = def.kind === "featured"
    ? await sitesService.getFeaturedSites()
    : await fetchAllSiteIds();
  const sites = await Promise.all(ids.map(fetchSiteDetailById));
  return sites.filter((s): s is SiteDetail => Boolean(s));
};

/**
 * Contenido de las landings «Destacados» y «Todos» (las de un tipo de sitio usan SiteTypeGuia). Va dentro de un <Suspense> para que la ruta
 * sea PPR (dinámica-capaz): así los slugs desconocidos se renderizan on-demand y
 * caen en notFound() en vez de romper (una ruta 100% estática no puede). El
 * contenido se streamea en la misma respuesta → crawlable.
 */
export async function SiteCollectionContent({ def }: { def: SiteCollectionDef }) {
  // Todos → misma lista paginada que el índice (se puede ver todo sin cambiar de página).
  if (def.kind === "all") {
    const { sites, nextCursor } = await fetchAllSitesPage();
    return (
      <Section spacing="sm" className="mt-4">
        <InfiniteSiteList category="all" initialSites={sites} initialCursor={nextCursor} />
      </Section>
    );
  }

  // Destacados → agrupados por tipo, cada grupo con "Ver más".
  const sites = await fetchCollectionSites(def);
  const groups = groupSitesByCategory(sites, getSiteCollections());

  if (groups.length === 0) {
    return (
      <Section spacing="sm" className="mt-4">
        <SiteDiscoveryGrid sites={[]} />
      </Section>
    );
  }

  return (
    <>
      {groups.map((g) => (
        <ContentSection
          key={g.key}
          title={g.label}
          action={g.landingSlug ? { href: `/donde-ir-${g.landingSlug}` } : undefined}
        >
          <SiteDiscoveryGrid sites={g.sites} />
        </ContentSection>
      ))}
    </>
  );
}
