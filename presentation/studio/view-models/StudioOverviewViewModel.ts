/**
 * ViewModel del Resumen del Estudio del Organizador.
 *
 * Contiene datos MOCK realistas para que el panel se vea completo.
 * Cuando el repositorio esté implementado, reemplaza `MOCK_STUDIO_OVERVIEW`
 * por el resultado de `StudioOverviewViewModelMapper.toViewModel(domainOverview)`.
 */

export interface KpiViewModel {
  label: string;
  value: number;
  previousValue?: number;
  changePct: number;
}

export interface StudioOverviewViewModel {
  kpis: {
    views: KpiViewModel;
    registrations: KpiViewModel;
    likes: KpiViewModel;
    activeEvents: KpiViewModel;
  };
  viewsVsRegistrations: { eventName: string; views: number; registrations: number }[];
  registrationsTimeline: { date: string; registrations: number }[];
  topEvents: { eventId: string; name: string; score: number; views: number }[];
  interactivity: { eventName: string; views: number; likes: number; shares: number }[];
}

// MOCK — datos de demostración. Reemplazar por datos reales del `StudioService`.
export const MOCK_STUDIO_OVERVIEW: StudioOverviewViewModel = {
  kpis: {
    views: { label: "Total de vistas", value: 18432, previousValue: 16400, changePct: 12.4 },
    registrations: { label: "Registros", value: 1284, previousValue: 1188, changePct: 8.1 },
    likes: { label: "Likes", value: 3956, previousValue: 4049, changePct: -2.3 },
    activeEvents: { label: "Eventos activos", value: 7, previousValue: 6, changePct: 16.7 },
  },
  viewsVsRegistrations: [
    { eventName: "Noche de Salsa", views: 4200, registrations: 320 },
    { eventName: "Feria Gastronómica", views: 3800, registrations: 410 },
    { eventName: "Mercado Artesanal", views: 2600, registrations: 150 },
    { eventName: "Concierto Andino", views: 5100, registrations: 280 },
    { eventName: "Ruta del Café", views: 1900, registrations: 124 },
  ],
  registrationsTimeline: Array.from({ length: 30 }, (_, i) => {
    // Curva con variación semanal: fines de semana con más inscripciones.
    const day = i + 1;
    const isWeekend = day % 7 === 0 || day % 7 === 6;
    const base = isWeekend ? 55 : 30;
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), day)
      .toISOString()
      .split("T")[0];
    return {
      date,
      registrations: base + ((day * 5) % 17),
    };
  }),
  topEvents: [
    { eventId: "evt-1", name: "Concierto Andino", score: 94, views: 5100 },
    { eventId: "evt-2", name: "Noche de Salsa", score: 88, views: 4200 },
    { eventId: "evt-3", name: "Feria Gastronómica", score: 81, views: 3800 },
    { eventId: "evt-4", name: "Mercado Artesanal", score: 67, views: 2600 },
    { eventId: "evt-5", name: "Ruta del Café", score: 59, views: 1900 },
  ],
  interactivity: [
    { eventName: "Noche de Salsa", views: 4200, likes: 980, shares: 210 },
    { eventName: "Feria Gastronómica", views: 3800, likes: 870, shares: 180 },
    { eventName: "Concierto Andino", views: 5100, likes: 1240, shares: 320 },
    { eventName: "Mercado Artesanal", views: 2600, likes: 520, shares: 95 },
  ],
};
