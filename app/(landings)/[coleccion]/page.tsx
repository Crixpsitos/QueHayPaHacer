import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Section } from "@/app/components/layout/shared/Section";
import { ContentSection } from "@/app/components/layout/shared/ContentSection";
import { EventCardInteractive } from "@/presentation/events/components/card/EventCardInteractive";
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper";
import {
  getEventCollections,
  getEventCollectionBySlug,
} from "@/presentation/events/lib/eventCollections";
import { groupEventsByCategory } from "@/presentation/events/lib/groupEventsByCategory";
import { fetchCollectionEvents } from "@/presentation/events/data/collectionFetchers";

// Con Cache Components no se usa `dynamicParams`: los slugs conocidos se
// prerenderean vía generateStaticParams; cualquier otro cae en `notFound()`
// dentro de la página (getEventCollectionBySlug → null → 404).

interface PageProps {
  params: Promise<{ coleccion: string }>;
}

const EMPTY_INFO = {
  title: "Todavía no hay eventos en esta colección",
  description:
    "Estamos sumando planes nuevos constantemente. Vuelve pronto para descubrir qué hay pa' hacer.",
};

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

  const events = await fetchCollectionEvents(def);
  const isCategory = def.kind === "category";

  // Destacados / fin de semana: se agrupan por categoría, cada grupo con "Ver más"
  // a su landing de categoría → flujo entre páginas. Categoría: lista plana.
  const collections = isCategory ? [] : await getEventCollections();
  const groups = isCategory ? [] : groupEventsByCategory(events, collections);

  return (
    <>
      <Section spacing="sm" className="mt-4">
        <h1 className="text-3xl font-bold">{def.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {def.description}
        </p>
      </Section>

      {isCategory ? (
        <Section spacing="sm" className="mt-4">
          <EventCardInteractive
            events={events.map((e) => EventViewModelMapper.toViewModel(e))}
            info={EMPTY_INFO}
            variant="vertical"
          />
        </Section>
      ) : groups.length === 0 ? (
        <Section spacing="sm" className="mt-4">
          <EventCardInteractive events={[]} info={EMPTY_INFO} variant="vertical" />
        </Section>
      ) : (
        groups.map((g) => (
          <ContentSection
            key={g.key}
            title={g.label}
            action={g.landingSlug ? { href: `/${g.landingSlug}` } : undefined}
          >
            <EventCardInteractive
              events={g.events.map((e) => EventViewModelMapper.toViewModel(e))}
              info={EMPTY_INFO}
              variant="horizontal"
            />
          </ContentSection>
        ))
      )}
    </>
  );
}
