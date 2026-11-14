import { SITE_URL } from "@/app/lib/site";
import { priceTiers } from "../components/detail/format";
import { buildProfileHref } from "@/presentation/profile/lib/profileHref";
import type { Location } from "@/domain/entities/events/value-objects/Location";
import type { Price } from "@/domain/entities/events/value-objects/Price";
import type { EventViewModel } from "../view-models/EventViewModel";
import type { SessionViewModel } from "../view-models/SessionViewModel";

type LdSession = Pick<SessionViewModel, "location" | "price" | "startDate" | "endDate">;
export interface EventJsonLdOpts {
  attendeeCount?: number;
  url?: string;
  /** Funciones publicadas de un evento de varias fechas: de ahí salen su lugar y su precio. */
  sessions?: LdSession[];
}

/** Sin lugar conocido (varias fechas en un listado, donde no se leen las funciones): la ciudad. Google exige `location`. */
const CITY_PLACE = {
  "@type": "Place",
  name: "Ibagué",
  address: { "@type": "PostalAddress", addressLocality: "Ibagué", addressRegion: "Tolima", addressCountry: "CO" },
};

function placeLd(loc: Location | null | undefined) {
  if (!loc || !(loc.venue || loc.address)) return CITY_PLACE;
  return {
    "@type": "Place",
    name: loc.venue || loc.address,
    address: {
      "@type": "PostalAddress",
      streetAddress: loc.address,
      addressLocality: loc.city?.name ?? "Ibagué",
      addressRegion: loc.department?.name ?? "Tolima",
      addressCountry: loc.country?.name ?? "CO",
    },
    ...(loc.coordinates ? { geo: { "@type": "GeoCoordinates", latitude: loc.coordinates.lat, longitude: loc.coordinates.lng } } : {}),
  };
}

/**
 * JSON-LD `Event` (schema.org) de un evento. Fuente única: lo usan las tarjetas de los listados
 * y la página de detalle. Varias fechas: lugar y precio viven en las funciones (`opts.sessions`);
 * sin ellas el lugar es la ciudad y la oferta se omite.
 */
export function buildEventJsonLd(event: EventViewModel, opts: EventJsonLdOpts = {}): Record<string, unknown> {
  const attendeeCount = opts.attendeeCount ?? 0;
  const url = opts.url ?? `${SITE_URL}/eventos/${event.slug || event.id}`;
  const isMultiDate = event.eventType === "multi-date";
  const sessions = opts.sessions ?? [];
  const now = new Date().toISOString();
  const nextSession = sessions.find((s) => s.endDate >= now) ?? sessions[0];
  const validFrom = event.publishedAt ?? event.createdAt;
  const availability =
    attendeeCount > 0 && event.capacity && attendeeCount >= event.capacity ? "https://schema.org/SoldOut" : "https://schema.org/InStock";
  const offer = (price: string, currency: string, name?: string) => ({
    "@type": "Offer", ...(name ? { name } : {}), price, priceCurrency: currency || "COP", availability, url, ...(validFrom ? { validFrom } : {}),
  });
  const amountOf = (p: Price) => (p.isFree ? 0 : p.amount || 0);

  let offers: unknown;
  if (isMultiDate) {
    // Una oferta con el precio más bajo entre las funciones.
    const prices = sessions.map((s) => s.price).filter(Boolean);
    if (prices.length) offers = offer(Math.min(...prices.map(amountOf)).toString(), prices[0].currency);
  } else if (event.price) {
    const tiers = priceTiers(event.price);
    offers = tiers.length
      ? tiers.map((t) => offer(t.amount.toString(), event.price.currency, t.name))
      : offer(amountOf(event.price).toString(), event.price.currency);
  }

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.shortDescription,
    url,
    ...(event.startDate ? { startDate: event.startDate } : {}),
    ...(event.endDate ? { endDate: event.endDate } : {}),
    eventStatus:
      event.status === "published" || event.status === "ended"
        ? "https://schema.org/EventScheduled"
        : event.status === "cancelled"
          ? "https://schema.org/EventCancelled"
          : "https://schema.org/EventPostponed",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: placeLd(isMultiDate ? nextSession?.location : event.location),
    organizer: {
      "@type": "Person",
      name: event.author.displayName,
      ...(event.author.id ? { url: `${SITE_URL}${buildProfileHref({ id: event.author.id })}` } : {}),
    },
    image: event.mainImage?.url,
    ...(offers ? { offers } : {}),
    keywords: event.categoryInfo?.tags?.join(", "),
    about: { "@type": "Thing", name: event.categoryInfo?.title },
  };
}

/** Texto listo para `dangerouslySetInnerHTML` de un `<script type="application/ld+json">`: `<` escapado para que un título no cierre el script. */
export function eventJsonLdHtml(event: EventViewModel, opts: EventJsonLdOpts = {}): string {
  return JSON.stringify(buildEventJsonLd(event, opts)).replace(/</g, "\\u003c");
}
