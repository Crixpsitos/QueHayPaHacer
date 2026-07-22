import { Section } from "@/app/components/layout/shared/Section";
import { ContentSection } from "@/app/components/layout/shared/ContentSection";
import { SiteDiscoveryGrid } from "./SiteDiscovery";
import { InfiniteSiteList } from "./InfiniteSiteList";
import { getSiteCollections, type SiteCollectionDef } from "../../lib/siteCollections";
import { groupSitesByCategory } from "../../lib/groupSitesByCategory";
import { fetchCollectionSites } from "../../data/siteFetchers";
import { getSiteCategoryPage } from "../../data/siteCategoryPage";

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
          action={g.landingSlug ? { href: `/donde-ir/${g.landingSlug}` } : undefined}
        >
          <SiteDiscoveryGrid sites={g.sites} />
        </ContentSection>
      ))}
    </>
  );
}
