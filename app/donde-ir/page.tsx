import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/app/components/layout/shared/Section";
import { ContentSection } from "@/app/components/layout/shared/ContentSection";
import { Separator } from "@/app/components/ui/separator";
import { SiteDiscoveryGrid } from "@/presentation/sites/components/discovery/SiteDiscovery";
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
        <h1 className="text-3xl font-bold">¿Dónde ir en Ibagué?</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Descubre los mejores lugares de la ciudad: dónde comer, tomar algo, pasear y más.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {typeCollections.map((c) => (
            <Link
              key={c.slug}
              href={siteCollectionHref(c.slug)}
              className="rounded-full border border-border bg-secondary px-4 py-1.5 text-sm font-medium transition-colors hover:bg-secondary/70"
            >
              {c.shortLabel}
            </Link>
          ))}
        </div>
      </Section>

      {featuredDef && (
        <ContentSection title="Destacados" action={{ href: siteCollectionHref(featuredDef.slug) }}>
          <SiteDiscoveryGrid sites={featured} showTrending />
        </ContentSection>
      )}

      <Separator className="my-6" />

      {allDef && (
        <ContentSection title="Todos los sitios" action={{ href: siteCollectionHref(allDef.slug) }}>
          <SiteDiscoveryGrid sites={all} />
        </ContentSection>
      )}
    </>
  );
}
