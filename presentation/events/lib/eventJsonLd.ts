import { SITE_URL } from "@/app/lib/site";
import type { EventViewModel } from "../view-models/EventViewModel";

/**
 * JSON-LD `Event` (schema.org) de un evento. Fuente única: lo usan las tarjetas de los listados
 * y la página de detalle. Multi-fecha: ubicación y precio viven en las sesiones, así que se omiten.
 */
export function buildEventJsonLd(event: EventViewModel, opts: { attendeeCount?: number } = {}): Record<string, unknown> {
  const attendeeCount = opts.attendeeCount ?? 0;
  const url = `${SITE_URL}/eventos/${event.slug || event.id}`;
  const isFree = event.price?.isFree ?? event.price?.amount === 0;
  const isMultiDate = event.eventType === "multi-date";
  const hasLocation = !isMultiDate && !!event.location;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.shortDescription,
    url,
    ...(event.startDate ? { startDate: event.startDate } : {}),
    ...(event.endDate ? { endDate: event.endDate } : {}),
    eventStatus:
      event.status === "published"
        ? "https://schema.org/EventScheduled"
        : event.status === "cancelled"
          ? "https://schema.org/EventCancelled"
          : "https://schema.org/EventPostponed",
    ...(hasLocation
      ? {
          location: {
            "@type": "Place",
            name: event.location.venue,
            address: {
              "@type": "PostalAddress",
              streetAddress: event.location.address,
              addressLocality: event.location.city.name,
              addressRegion: event.location.department.name,
              addressCountry: event.location.country.name,
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: event.location.coordinates.lat,
              longitude: event.location.coordinates.lng,
            },
          },
        }
      : {}),
    organizer: { "@type": "Person", name: event.author.displayName },
    image: event.mainImage?.url,
    ...(isMultiDate
      ? {}
      : {
          offers: {
            "@type": "Offer",
            price: isFree ? "0" : event.price.amount.toString(),
            priceCurrency: event.price.currency ?? "COP",
            availability:
              attendeeCount > 0 && event.capacity && attendeeCount >= event.capacity
                ? "https://schema.org/SoldOut"
                : "https://schema.org/InStock",
            url,
          },
        }),
    keywords: event.categoryInfo.tags.join(", "),
    about: { "@type": "Thing", name: event.categoryInfo.title },
  };
}
