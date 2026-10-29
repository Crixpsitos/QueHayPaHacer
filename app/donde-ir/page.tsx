import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { Section } from "@/app/components/layout/shared/Section";
import { ContentSection } from "@/app/components/layout/shared/ContentSection";
import { Separator } from "@/app/components/ui/separator";
import { SiteDiscoveryGrid } from "@/presentation/sites/components/discovery/SiteDiscovery";
import { SiteCategoryChips } from "@/presentation/sites/components/discovery/SiteCategoryChips";
import { getSiteCollections } from "@/presentation/sites/lib/siteCollections";
import { InfiniteSiteList } from "@/presentation/sites/components/discovery/InfiniteSiteList";
import { fetchAllSitesPage, fetchFeaturedSites } from "@/presentation/sites/data/siteListFetchers";

export const metadata: Metadata = {
  title: "¿Dónde ir en Ibagué?",
  description:
    "Descubre los mejores lugares en Ibagué: cafeterías, bares, restaurantes, parques, museos y más. Encuentra dónde ir.",
  alternates: { canonical: "/donde-ir" },
};

// Los destacados (8) salen de los primeros: se pide de más para que "Todos" empiece con una tanda completa.
const FIRST_PAGE = 20;

export default async function DondeIrIndexPage() {
  const typeCollections = getSiteCollections().filter((c) => c.kind === "type");

  const [featured, allPage] = await Promise.all([fetchFeaturedSites(), fetchAllSitesPage(FIRST_PAGE)]);
  const featuredIds = featured.map((s) => s.id);

  return (
    <>
      <Section spacing="sm" className="mt-4">
        <div className="flex items-center gap-1.5 text-sm font-medium text-[#71717A]">
          <MapPin className="size-4 text-[#D42F3C]" />
          <span>Ibagué, Tolima</span>
        </div>

        <h1
          className="mt-2 text-4xl font-bold tracking-tight text-[#09090B]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          ¿Dónde ir en <span className="text-[#D42F3C]">Ibagué</span>?
        </h1>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-[#71717A]">
          Los mejores lugares de la ciudad: cafeterías, restaurantes, bares, parques y más.
        </p>

        {typeCollections.length > 0 && (
          <div className="mt-6">
            <p className="mb-3 text-sm font-medium text-[#52525B]">
              Explorar por tipo de lugar
            </p>
            <SiteCategoryChips collections={typeCollections} />
          </div>
        )}
      </Section>

      {featured.length > 0 && (
        <ContentSection title="Destacados">
          <SiteDiscoveryGrid sites={featured} />
        </ContentSection>
      )}

      {featured.length > 0 && <Separator className="my-6" />}

      {/* Todos los sitios, con "Cargar más" aquí mismo (sin mandar a otra página). */}
      <ContentSection title="Todos los sitios">
        <InfiniteSiteList
          category="all"
          initialSites={allPage.sites}
          initialCursor={allPage.nextCursor}
          excludeIds={featuredIds}
        />
      </ContentSection>
    </>
  );
}
