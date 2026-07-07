/**
 * ViewModels de la sección "Sitios" del Estudio.
 * Alimentados con datos reales vía `studioService.getOrganizerSites` (lista) y
 * `getSiteAnalytics` + `getEventsBySite` (detalle).
 */

export interface StudioSiteListItem {
  id: string;
  name: string;
  category: string;
  image?: string;
  clicks: number;
  likes: number;
  shares: number;
  eventsCount: number;
  /** MOCK: tendencia semanal (%). Placeholder para pruebas de UI; aún no es real. */
  trend: number;
}

export interface SiteEventItem {
  eventId: string;
  name: string;
  date: string | null; // ISO — null si el evento no tiene fecha de inicio
  status: string;
  image?: string;
  views: number;
  registrations: number;
}

export interface SiteDetailViewModel {
  id: string;
  name: string;
  category: string;
  image?: string;
  totalClicks: number;
  totalLikes: number;
  totalShares: number;
  /** Serie temporal de interacciones (engagement) por periodo. */
  interactionsOverTime: { date: string; clicks: number; likes: number; shares: number }[];
  /** Total real de eventos del sitio (contador), independiente de la búsqueda/limit. */
  eventsCount: number;
  /** Eventos de la página actual (search + cursor server-side vía `getEventsBySite`). */
  events: SiteEventItem[];
  /** ISO del cursor para "Siguiente" en el itinerario. `null` si no hay más páginas. */
  eventsNextCursor: string | null;
  /** ISO del cursor para "Anterior" en el itinerario. `null` si es la primera página. */
  eventsPrevCursor: string | null;
  /** Tamaño de página actual del itinerario. */
  eventsLimit: number;
  /** Opciones del selector "Mostrar N" del itinerario. */
  eventsLimitOptions: number[];
}
