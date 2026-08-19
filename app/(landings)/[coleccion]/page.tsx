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
import type { CollectionKind } from "@/presentation/events/lib/eventCollections";
import { MapPin } from "lucide-react";

function CollectionSkeleton({ kind }: { kind: CollectionKind }) {
  if (kind === "category") {
    return (
      <Section spacing="sm" className="mt-4">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-2xl border border-[#F4F4F5] bg-white p-4">
              <div className="aspect-video w-full animate-pulse rounded-xl bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </Section>
    );
  }
  return <EventsSectionsSkeleton />;
}

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

      <Suspense fallback={<CollectionSkeleton kind={def.kind} />}>
        <CollectionEventsSection def={def} />
      </Suspense>
    </>
  );
}
