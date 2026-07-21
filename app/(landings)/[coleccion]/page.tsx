import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Section } from "@/app/components/layout/shared/Section";
import { EventsSectionsSkeleton } from "@/presentation/events/components/EventsSectionsSkeleton";
import { CollectionEventsSection } from "@/presentation/events/components/CollectionEventsSection";
import {
  getEventCollections,
  getEventCollectionBySlug,
} from "@/presentation/events/lib/eventCollections";

// Con Cache Components no se usa `dynamicParams`: los slugs conocidos se
// prerenderean vía generateStaticParams; cualquier otro cae en `notFound()`.
// El shell (h1 + metadata) es estático (SEO); la sección de eventos es un hueco
// PPR (<Suspense>) que lee la cookie para pintar el like del usuario.

interface PageProps {
  params: Promise<{ coleccion: string }>;
}

export async function generateStaticParams() {
  const collections = await getEventCollections();
  // Cache Components exige al menos un param; siempre hay destacados/fin de semana.
  return collections.map((c) => ({ coleccion: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { coleccion } = await params;
  const def = await getEventCollectionBySlug(coleccion);
  if (!def) return {};

  const url = `/${def.slug}`;
  return {
    title: def.metaTitle,
    description: def.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: def.metaTitle,
      description: def.metaDescription,
      url,
      type: "website",
    },
  };
}

export default async function CollectionLandingPage({ params }: PageProps) {
  const { coleccion } = await params;
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
