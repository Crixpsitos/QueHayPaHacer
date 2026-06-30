/**
 * ViewModels de la sección "Sitios" del Estudio.
 * Datos MOCK por ahora (ver `lib/studioSitesMock.ts`).
 * Repos relacionados (stubs): `getSiteAnalytics`, `getEventsBySite`.
 */

export interface StudioSiteListItem {
  id: string;
  name: string;
  category: string;
  image?: string;
  clicks: number;
  eventsCount: number;
}

export interface SiteEventItem {
  eventId: string;
  name: string;
  date: string; // ISO
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
  clicksOverTime: { date: string; clicks: number }[];
  events: SiteEventItem[];
}
