import Link from "next/link";
import { Section } from "@/app/components/layout/shared/Section";
import { ContentSection } from "@/app/components/layout/shared/ContentSection";
import { EventCardInteractive } from "@/presentation/events/components/card/EventCardInteractive";
import { InfiniteEventList } from "@/presentation/events/components/InfiniteEventList";
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper";
import { getEventCollections, type CollectionDef } from "@/presentation/events/lib/eventCollections";
import { groupEventsByCategory } from "@/presentation/events/lib/groupEventsByCategory";
import { fetchCollectionEvents, fetchTodayEvents } from "@/presentation/events/data/collectionFetchers";
import { getAllEventsPage } from "@/presentation/events/data/allEventsPage";
import { getCategoryEventsPage } from "@/presentation/events/data/categoryEventsPage";
import { SITE_URL } from "@/app/lib/site";
import type { Events } from "@/domain/entities/events/Events";

const EMPTY_INFO = {
  title: "Todavía no hay eventos en esta colección",
  description:
    "Estamos sumando planes nuevos constantemente. Mientras tanto, revisa la agenda completa.",
  action: { href: "/eventos", label: "Ver todos los eventos" },
};

function NoEventsNote({ text }: { text: string }) {
  return (
    <Section spacing="sm" className="mt-2">
      <p className="text-sm text-muted-foreground">
        {text} <Link href="/eventos" className="font-medium text-primary-dark underline-offset-2 hover:underline">Ver la agenda completa</Link>
      </p>
    </Section>
  );
}

/** ItemList JSON-LD → elegibilidad para carrusel de eventos en Google (URLs absolutas). */
function ItemListJsonLd({ events }: { events: Events[] }) {
  if (events.length === 0) return null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: events.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/eventos/${e.slug || e.id}`,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
    />
  );
}

/**
 * Contenido de una landing: igual para todos (se cachea en el CDN). El estado de "me gusta" de cada persona
 * lo resuelve EventCardInteractive en el cliente (POST /api/events/likes), sin leer cookies aquí.
 */
export async function CollectionEventsSection({ def }: { def: CollectionDef }) {
  // Categoría: query por slug del evento (cubre slugs en español e inglés).
  if (def.kind === "category" && def.categoryId) {
    const { events, nextCursor } = await getCategoryEventsPage(def.categoryId, null, undefined, def.categorySlug);
    return (
      <Section spacing="sm" className="mt-4">
        <ItemListJsonLd events={events} />
        <InfiniteEventList
          categoryId={def.categoryId}
          categorySlug={def.categorySlug}
          initialEvents={events.map((e) => EventViewModelMapper.toViewModel(e))}
          initialCursor={nextCursor}
          initialLikedByEventId={{}}
        />
      </Section>
    );
  }

  // "Todos": misma lista paginada que /eventos (primera página + "Cargar más").
  if (def.kind === "all") {
    const { events, nextCursor } = await getAllEventsPage(null);
    return (
      <Section spacing="sm" className="mt-4">
        <ItemListJsonLd events={events} />
        <InfiniteEventList
          initialEvents={events.map((e) => EventViewModelMapper.toViewModel(e))}
          initialCursor={nextCursor}
          initialLikedByEventId={{}}
        />
      </Section>
    );
  }

  // Hoy: lista plana por relevancia; sin eventos hoy, los próximos con aviso honesto.
  if (def.kind === "today") {
    const { events, fallback } = await fetchTodayEvents();
    if (events.length === 0) {
      // Sin eventos hoy: aviso corto (las actividades de hoy van justo debajo y son lo importante).
      return <NoEventsNote text="Hoy no hay eventos publicados." />;
    }
    return (
      <>
        <ItemListJsonLd events={events} />
        <ContentSection
          title={fallback ? "Hoy no hay eventos publicados. Estos son los próximos" : "Eventos de hoy"}
          action={fallback ? undefined : { href: "/eventos-este-fin-de-semana-ibague", label: "Este fin de semana" }}
        >
          <EventCardInteractive events={events.map((e) => EventViewModelMapper.toViewModel(e))} info={EMPTY_INFO} variant="vertical" />
        </ContentSection>
      </>
    );
  }

  // Destacados/fin de semana: agrupados por categoría.
  const events = await fetchCollectionEvents(def);

  const collections = await getEventCollections();
  const groups = groupEventsByCategory(events, collections);

  if (groups.length === 0) {
    return <NoEventsNote text="Todavía no hay eventos publicados para esta fecha." />;
  }

  return (
    <>
      <ItemListJsonLd events={events} />
      {groups.map((g) => (
        <ContentSection
          key={g.key}
          title={g.label}
          action={g.landingSlug ? { href: `/${g.landingSlug}` } : undefined}
        >
          <EventCardInteractive
            events={g.events.map((e) => EventViewModelMapper.toViewModel(e))}
            info={EMPTY_INFO}
            variant="vertical"
          />
        </ContentSection>
      ))}
    </>
  );
}
