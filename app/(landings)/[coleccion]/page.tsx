import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Section } from "@/app/components/layout/shared/Section";
import { EventsSectionsSkeleton } from "@/presentation/events/components/EventsSectionsSkeleton";
import { CollectionEventsSection } from "@/presentation/events/components/CollectionEventsSection";
import { SiteCollectionContent } from "@/presentation/sites/components/discovery/SiteCollectionContent";
import { getEventCollectionBySlug } from "@/presentation/events/lib/eventCollections";
import { getSiteCollectionBySlug } from "@/presentation/sites/lib/siteCollections";
import { SITE_NAME, DEFAULT_OG_IMAGE } from "@/app/lib/site";
import type { CollectionKind } from "@/presentation/events/lib/eventCollections";
import { CollectionActivitiesSection } from "@/presentation/activities/components/CollectionActivitiesSection";
import { TodayGuide } from "@/presentation/events/components/TodayGuide";
import { CategoryCartelera } from "@/presentation/events/components/CategoryCartelera";
import { MapPin } from "lucide-react";
import { fetchTodayLabel } from "@/presentation/events/data/collectionFetchers";
import { ACTIVITY_PREFIX, getActivityCollectionBySlug } from "@/presentation/activities/lib/activityCollections";
import { isIndexableCollection } from "@/domain/entities/activities/collectionRule";
import { fetchActivityPage } from "@/presentation/activities/data/fetchers";
import { ActivityCard } from "@/presentation/activities/components/ActivityCard";
import { PublishBand } from "@/presentation/activities/components/PublishBand";
import { activityListJsonLdHtml } from "@/presentation/activities/lib/activityListJsonLd";
import { SITE_URL } from "@/app/lib/site";

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

  // ¿Es una colección de actividades? (regla de fundamento: sin texto propio o con menos de 3 actividades → noindex)
  if (coleccion.startsWith(ACTIVITY_PREFIX)) {
    const def = getActivityCollectionBySlug(coleccion);
    if (!def) return { robots: { index: false, follow: false } };
    const { total } = await fetchActivityPage(def.filters, 0, 1);
    const url = `/${def.slug}`;
    return {
      title: def.metaTitle,
      description: def.metaDescription,
      alternates: { canonical: url },
      robots: isIndexableCollection(def.intro.join(" "), total) ? undefined : { index: false, follow: true },
      openGraph: { title: def.metaTitle, description: def.metaDescription, url, type: "website", siteName: SITE_NAME, locale: "es_CO", images: [DEFAULT_OG_IMAGE] },
    };
  }

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
      openGraph: { title: def.metaTitle, description: def.metaDescription, url, type: "website", siteName: SITE_NAME, locale: "es_CO", images: [DEFAULT_OG_IMAGE] },
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
    openGraph: { title: def.metaTitle, description: def.metaDescription, url, type: "website", siteName: SITE_NAME, locale: "es_CO", images: [DEFAULT_OG_IMAGE] },
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

  // Colección de actividades: /actividades-gratis-ibague, /actividades-hoy-ibague…
  if (coleccion.startsWith(ACTIVITY_PREFIX)) {
    const def = getActivityCollectionBySlug(coleccion);
    if (!def) notFound();
    const page = await fetchActivityPage(def!.filters, 0, 24);
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: activityListJsonLdHtml({ siteUrl: SITE_URL, path: `/${def!.slug}`, name: def!.title, items: page.items.map((a) => ({ slug: a.slug, title: a.title })) }) }} />
        <Section spacing="sm" className="mt-4">
          <h1 className="text-3xl font-bold">{def!.title}</h1>
          <div className="mt-3 grid max-w-2xl gap-3 text-[0.9375rem] leading-relaxed text-muted-foreground">{def!.intro.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}</div>
        </Section>
        <Section spacing="sm" className="mt-4">
          {page.items.length ? (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{page.items.map((a, i) => <ActivityCard key={a.id} a={a} priority={i < 3} />)}</ul>
          ) : (
            <p className="rounded-3xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">Todavía no hay actividades aquí. Mira <a href="/actividades" className="font-semibold text-primary-dark underline">todas las actividades</a>.</p>
          )}
        </Section>
        <Section spacing="sm" className="mt-6"><PublishBand /></Section>
      </>
    );
  }

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
  // Hoy: el subtítulo lleva el día ("planes para hoy domingo 8 de noviembre"), las palabras de las búsquedas reales.
  // Categoría: variante de la cartelera (cabecera propia + mismas boletas y filtros que /eventos).
  if (def.kind === "category") return <CategoryCartelera def={def} />;
  const description = def.kind === "today"
    ? `Planes para hoy ${await fetchTodayLabel()} en ${def.cityLabel}: eventos, conciertos, cultura y gastronomía.`
    : def.description;

  return (
    <>
      <Section spacing="sm" className="mt-4">
        <h1 className="text-3xl font-bold">{def.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </Section>

      <Suspense fallback={<CollectionSkeleton kind={def.kind} />}>
        <CollectionEventsSection def={def} />
      </Suspense>
      {def.kind === "today" || def.kind === "weekend" ? (
        <Suspense fallback={null}>
          <CollectionActivitiesSection kind={def.kind} />
        </Suspense>
      ) : null}
      {def.kind === "today" ? <TodayGuide /> : null}
    </>
  );
}
