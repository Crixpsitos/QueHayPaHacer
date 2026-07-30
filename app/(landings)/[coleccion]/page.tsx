import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Section } from "@/app/components/layout/shared/Section";
import { EventsSectionsSkeleton } from "@/presentation/events/components/EventsSectionsSkeleton";
import { CollectionEventsSection } from "@/presentation/events/components/CollectionEventsSection";
import { SiteCollectionContent } from "@/presentation/sites/components/discovery/SiteCollectionContent";
import { getEventCollectionBySlug } from "@/presentation/events/lib/eventCollections";
import { getSiteCollectionBySlug } from "@/presentation/sites/lib/siteCollections";
import { SITE_NAME } from "@/app/lib/site";

const DONDE_IR_PREFIX = "donde-ir-";

interface PageProps {
  params: Promise<{ coleccion: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { coleccion } = await params;

  // ¿Es una colección de sitios?
  if (coleccion.startsWith(DONDE_IR_PREFIX)) {
    const siteSlug = coleccion.slice(DONDE_IR_PREFIX.length);
    const def = getSiteCollectionBySlug(siteSlug);
    if (!def) return { robots: { index: false, follow: false } };
    const url = `/donde-ir-${def.slug}`;
    return {
      title: def.metaTitle,
      description: def.metaDescription,
      alternates: { canonical: url },
      openGraph: { title: def.metaTitle, description: def.metaDescription, url, type: "website", siteName: SITE_NAME, locale: "es_CO" },
    };
  }

  // ¿Es una colección de eventos?
  const def = await getEventCollectionBySlug(coleccion);
  if (!def) return { robots: { index: false, follow: false } };
  const url = `/${def.slug}`;
  return {
    title: def.metaTitle,
    description: def.metaDescription,
    alternates: { canonical: url },
    openGraph: { title: def.metaTitle, description: def.metaDescription, url, type: "website", siteName: SITE_NAME, locale: "es_CO" },
  };
}

export default async function CollectionLandingPage({ params }: PageProps) {
  return (
    <Suspense fallback={<EventsSectionsSkeleton />}>
      <CollectionLanding params={params} />
    </Suspense>
  );
}

async function CollectionLanding({ params }: PageProps) {
  const { coleccion } = await params;

  // Colección de sitios: /donde-ir-museos-ibague, /donde-ir-parques-ibague…
  if (coleccion.startsWith(DONDE_IR_PREFIX)) {
    const siteSlug = coleccion.slice(DONDE_IR_PREFIX.length);
    const def = getSiteCollectionBySlug(siteSlug);
    if (!def) notFound();
    return (
      <>
        <Section spacing="sm" className="mt-4">
          <h1 className="text-3xl font-bold">{def!.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {def!.description}
          </p>
        </Section>
        <SiteCollectionContent def={def!} />
      </>
    );
  }

  // Colección de eventos
  const def = await getEventCollectionBySlug(coleccion);
  if (!def) notFound();

  return (
    <>
      <Section spacing="sm" className="mt-4">
        <h1 className="text-3xl font-bold">{def.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {def.description}
        </p>
      </Section>

      <Suspense fallback={<EventsSectionsSkeleton />}>
        <CollectionEventsSection def={def} />
      </Suspense>
    </>
  );
}
