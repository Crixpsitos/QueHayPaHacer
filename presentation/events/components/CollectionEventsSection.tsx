import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { Section } from "@/app/components/layout/shared/Section";
import { ContentSection } from "@/app/components/layout/shared/ContentSection";
import { EventCardInteractive } from "@/presentation/events/components/card/EventCardInteractive";
import { InfiniteEventList } from "@/presentation/events/components/InfiniteEventList";
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper";
import { getEventCollections, type CollectionDef } from "@/presentation/events/lib/eventCollections";
import { groupEventsByCategory } from "@/presentation/events/lib/groupEventsByCategory";
import { fetchCollectionEvents } from "@/presentation/events/data/collectionFetchers";
import { getCategoryEventsPage } from "@/presentation/events/data/categoryEventsPage";
import { fetchUserLiked, fetchEventDetailById } from "@/presentation/events/data/eventDetailFetchers";
import { createServerContainer } from "@/infraestructure/di/container";
import { SITE_URL } from "@/app/lib/site";
import type { Events } from "@/domain/entities/events/Events";

const EMPTY_INFO = {
  title: "Todavía no hay eventos en esta colección",
  description:
    "Estamos sumando planes nuevos constantemente. Vuelve pronto para descubrir qué hay pa' hacer.",
};

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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/**
 * Hueco dinámico (PPR) de una landing: lee la cookie del usuario para pintar SU
 * estado de like. Va dentro de un <Suspense> — con Cache Components leer
 * `cookies()` obliga a un boundary. El shell (h1/meta/SEO) queda estático; esto
 * se streamea en la misma respuesta (crawlable).
 */
export async function CollectionEventsSection({ def }: { def: CollectionDef }) {
  const tokens = await getTokens(await cookies(), authConfig);
  const userId = tokens?.decodedToken?.uid;

  const likesFor = async (events: Events[]): Promise<Record<string, boolean>> => {
    const map: Record<string, boolean> = {};
    if (userId) {
      const results = await Promise.all(
        events.map(async (e) => ({ id: e.id, liked: await fetchUserLiked(e.id, userId) })),
      );
      for (const { id, liked } of results) map[id] = liked;
    }
    return map;
  };

  // Categoría: query por slug del evento (cubre slugs en español e inglés).
  if (def.kind === "category" && def.categoryId) {
    const { events, nextCursor } = await getCategoryEventsPage(def.categoryId, null, undefined, def.categorySlug);
    const likedByEventId = await likesFor(events);
    return (
      <Section spacing="sm" className="mt-4">
        <ItemListJsonLd events={events} />
        <InfiniteEventList
          categoryId={def.categoryId}
          categorySlug={def.categorySlug}
          initialEvents={events.map((e) => EventViewModelMapper.toViewModel(e))}
          initialCursor={nextCursor}
          initialLikedByEventId={likedByEventId}
        />
      </Section>
    );
  }

  const events = await fetchCollectionEvents(def);
  const likedByEventId = await likesFor(events);

  // "Todos": lista plana (catálogo). Destacados/fin de semana: agrupados por categoría.
  if (def.kind === "all") {
    return (
      <Section spacing="sm" className="mt-4">
        <ItemListJsonLd events={events} />
        <EventCardInteractive
          events={events.map((e) => EventViewModelMapper.toViewModel(e))}
          likedByEventId={likedByEventId}
          info={EMPTY_INFO}
          variant="vertical"
        />
      </Section>
    );
  }

  const collections = await getEventCollections();
  const groups = groupEventsByCategory(events, collections);

  if (groups.length === 0) {
    return (
      <Section spacing="sm" className="mt-4">
        <EventCardInteractive events={[]} info={EMPTY_INFO} variant="vertical" />
      </Section>
    );
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
            likedByEventId={likedByEventId}
            info={EMPTY_INFO}
            variant="vertical"
          />
        </ContentSection>
      ))}
    </>
  );
}
