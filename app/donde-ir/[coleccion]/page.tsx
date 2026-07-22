import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Section } from "@/app/components/layout/shared/Section";
import { EventsSectionsSkeleton } from "@/presentation/events/components/EventsSectionsSkeleton";
import { SiteCollectionContent } from "@/presentation/sites/components/discovery/SiteCollectionContent";
import { getSiteCollectionBySlug } from "@/presentation/sites/lib/siteCollections";
import { SITE_NAME } from "@/app/lib/site";

interface PageProps {
  params: Promise<{ coleccion: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { coleccion } = await params;
  const def = getSiteCollectionBySlug(coleccion);
  // Slug desconocido → noindex (evita soft-404 indexado).
  if (!def) return { robots: { index: false, follow: false } };

  const url = `/donde-ir/${def.slug}`;
  return {
    title: def.metaTitle,
    description: def.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: def.metaTitle,
      description: def.metaDescription,
      url,
      type: "website",
      siteName: SITE_NAME,
      locale: "es_CO",
    },
  };
}

/**
 * Sin generateStaticParams → ruta dinámica (ƒ). Bajo Cache Components, notFound()
 * en el shell estático de una ruta SSG revienta en prod (E22: revalidate 0 < 1);
 * como ruta dinámica, notFound() sí sirve un 404 real. El contenido igual se
 * cachea vía "use cache" en los fetchers, así que PPR sigue cacheando datos.
 * Acceso a params dentro de <Suspense> (params es runtime sin generateStaticParams).
 */
export default async function SiteCollectionLandingPage({ params }: PageProps) {
  return (
    <Suspense fallback={<EventsSectionsSkeleton />}>
      <SiteCollectionLanding params={params} />
    </Suspense>
  );
}

async function SiteCollectionLanding({ params }: PageProps) {
  const { coleccion } = await params;
  const def = getSiteCollectionBySlug(coleccion);
  if (!def) notFound();

  return (
    <>
      <Section spacing="sm" className="mt-4">
        <h1 className="text-3xl font-bold">{def.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {def.description}
        </p>
      </Section>

      <SiteCollectionContent def={def} />
    </>
  );
}
