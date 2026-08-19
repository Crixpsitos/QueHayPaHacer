import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { Section } from "@/app/components/layout/shared/Section";
import { ContentSection } from "@/app/components/layout/shared/ContentSection";
import { Separator } from "@/app/components/ui/separator";
import { SiteDiscoveryGrid } from "@/presentation/sites/components/discovery/SiteDiscovery";
import { SiteCategoryChips } from "@/presentation/sites/components/discovery/SiteCategoryChips";
import { getSiteCollections, siteCollectionHref, type SiteCollectionDef } from "@/presentation/sites/lib/siteCollections";
import { createServerContainer } from "@/infraestructure/di/container";
import { cacheLife, cacheTag } from "next/cache";
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel";

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

export const metadata: Metadata = {
  title: "¿Dónde ir en Ibagué?",
  description:
    "Descubre los mejores lugares en Ibagué: cafeterías, bares, restaurantes, parques, museos y más. Encuentra dónde ir.",
  alternates: { canonical: "/donde-ir" },
};

export default async function DondeIrIndexPage() {
  const collections = getSiteCollections();
  const featuredDef = collections.find((c) => c.kind === "featured");
  const allDef = collections.find((c) => c.kind === "all");
  const typeCollections = collections.filter((c) => c.kind === "type");

  const [featured, all] = await Promise.all([
    featuredDef ? fetchCollectionSites(featuredDef) : Promise.resolve([]),
    allDef ? fetchCollectionSites(allDef) : Promise.resolve([]),
  ]);

  return (
    <>
      <Section spacing="sm" className="mt-4">
        <div className="flex items-center gap-1.5 text-sm font-medium text-[#71717A]">
          <MapPin className="size-4 text-[#E63946]" />
          <span>Ibagué, Tolima</span>
        </div>

        <h1
          className="mt-2 text-4xl font-bold tracking-tight text-[#09090B]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          ¿Dónde ir en <span className="text-[#E63946]">Ibagué</span>?
        </h1>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-[#71717A]">
          Los mejores lugares de la ciudad: cafeterías, restaurantes, bares, parques y más.
        </p>

        {typeCollections.length > 0 && (
          <div className="mt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#71717A]">
              Explorar por tipo de lugar
            </p>
            <SiteCategoryChips collections={typeCollections} />
          </div>
        )}
      </Section>

      {featuredDef && featured.length > 0 && (
        <ContentSection title="Destacados" action={{ href: siteCollectionHref(featuredDef.slug) }}>
          <SiteDiscoveryGrid sites={featured} showTrending layout="featured" />
        </ContentSection>
      )}

      <Separator className="my-6" />

      {allDef && all.length > 0 && (
        <ContentSection title="Todos los sitios" action={{ href: siteCollectionHref(allDef.slug) }}>
          <SiteDiscoveryGrid sites={all} />
        </ContentSection>
      )}
    </>
  );
}
