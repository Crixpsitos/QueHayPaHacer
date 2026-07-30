import { Section } from "@/app/components/layout/shared/Section";
import { ContentSection } from "@/app/components/layout/shared/ContentSection";
import { SiteDiscoveryGrid } from "./SiteDiscovery";
import { InfiniteSiteList } from "./InfiniteSiteList";
import { getSiteCollections, type SiteCollectionDef } from "../../lib/siteCollections";
import { groupSitesByCategory } from "../../lib/groupSitesByCategory";
import { createServerContainer } from "@/infraestructure/di/container";
import { cacheLife, cacheTag } from "next/cache";
import type { SiteDetail } from "../../view-models/SiteFormViewModel";
import type { SiteCategory } from "../../view-models/SiteFormViewModel";

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
    : await sitesService.getAllSites();
  const sites = await Promise.all(ids.map(fetchSiteDetailById));
  return sites.filter((s): s is SiteDetail => Boolean(s));
};

const getSiteCategoryPage = async (
  category: SiteCategory,
  cursor: string | null,
  limit = 12,
): Promise<{ sites: SiteDetail[]; nextCursor: string | null }> => {
  "use cache";
  cacheLife("days");
  cacheTag("site-list", `site-type-${category}`);
  const { sitesService } = createServerContainer();
  const { ids, nextCursor } = await sitesService.getSitesByCategory(category as string, limit, cursor);
  const sites = (await Promise.all(ids.map(fetchSiteDetailById))).filter(
    (s): s is SiteDetail => Boolean(s),
  );
  return { sites, nextCursor };
};

/**
 * Contenido de una landing de sitios. Va dentro de un <Suspense> para que la ruta
 * sea PPR (dinámica-capaz): así los slugs desconocidos se renderizan on-demand y
 * caen en notFound() en vez de romper (una ruta 100% estática no puede). El
 * contenido se streamea en la misma respuesta → crawlable.
 */
export async function SiteCollectionContent({ def }: { def: SiteCollectionDef }) {
  // Tipo → infinite scroll (primera página por cursor).
  if (def.kind === "type" && def.category) {
    const { sites, nextCursor } = await getSiteCategoryPage(def.category, null);
    return (
      <Section spacing="sm" className="mt-4">
        <InfiniteSiteList
          category={def.category}
          initialSites={sites}
          initialCursor={nextCursor}
        />
      </Section>
    );
  }

  // Destacados / todos → agrupados por tipo, cada grupo con "Ver más".
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
