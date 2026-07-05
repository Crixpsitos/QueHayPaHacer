import type {
  StudioSiteListItem,
  SiteDetailViewModel,
  SiteEventItem,
} from "../view-models/StudioSitesViewModel";
import { MOCK_STUDIO_EVENTS } from "./studioEventsMock";

/**
 * Datos MOCK para la sección "Sitios".
 * Reemplazar por `studioService.getSiteAnalytics` / `getEventsBySite` cuando el
 * repositorio esté implementado. Los eventos enlazan a ids reales del studio.
 */

// MOCK — lista de sitios del organizador
export const MOCK_STUDIO_SITES: StudioSiteListItem[] = [
  {
    id: "site-cafe",
    name: "Café de la Plaza",
    category: "Cafetería",
    image: "https://picsum.photos/seed/cafedelaplaza/800/500",
    clicks: 1840,
    eventsCount: 3,
  },
  {
    id: "site-parque",
    name: "Parque Temático Andino",
    category: "Parque temático",
    image: "https://picsum.photos/seed/parqueandino/800/500",
    clicks: 3120,
    eventsCount: 2,
  },
  {
    id: "site-bar",
    name: "Bar La Terraza",
    category: "Bar",
    image: "https://picsum.photos/seed/laterraza/800/500",
    clicks: 980,
    eventsCount: 1,
  },
  {
    id: "site-salon",
    name: "Salón Cultural Centro",
    category: "Salón de eventos",
    image: "https://picsum.photos/seed/saloncentro/800/500",
    clicks: 2210,
    eventsCount: 4,
  },
];

const buildClicksOverTime = (total: number) =>
  Array.from({ length: 8 }, (_, i) => {
    const week = i + 1;
    const base = Math.round((total / 8) * (0.6 + (i % 4) * 0.18));
    return { date: `Sem ${week}`, clicks: base };
  });

// MOCK — ids de eventos asociados a cada sitio (enlazan a eventos reales del studio)
const SITE_EVENT_IDS: Record<string, string[]> = {
  "site-cafe": ["evt-internal", "evt-none", "evt-draft"],
  "site-parque": ["evt-external", "evt-form"],
  "site-bar": ["evt-internal"],
  "site-salon": ["evt-form", "evt-external", "evt-internal", "evt-none"],
};

// Construye los eventos del sitio reutilizando los datos del evento (imagen, vistas, registros).
const buildSiteEvents = (siteId: string): SiteEventItem[] =>
  (SITE_EVENT_IDS[siteId] ?? []).flatMap((eventId) => {
    const event = MOCK_STUDIO_EVENTS.find((e) => e.id === eventId);
    if (!event) return [];
    return [
      {
        eventId: event.id,
        name: event.name,
        date: event.date ?? "",
        status: event.status,
        image: event.image,
        views: event.views,
        registrations: event.registrations,
      },
    ];
  });

// MOCK — detalle/analíticas de un sitio
export function getMockSiteDetail(siteId: string): SiteDetailViewModel | null {
  const site = MOCK_STUDIO_SITES.find((s) => s.id === siteId);
  if (!site) return null;
  return {
    id: site.id,
    name: site.name,
    category: site.category,
    image: site.image,
    totalClicks: site.clicks,
    clicksOverTime: buildClicksOverTime(site.clicks),
    events: buildSiteEvents(site.id),
  };
}
