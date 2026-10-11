import type { OrganizerOverview } from "@/domain/entities/studio/Studio";
import type { StudioOverviewViewModel } from "../view-models/StudioOverviewViewModel";

/**
 * Mapper: entidad de dominio `OrganizerOverview` → `StudioOverviewViewModel`.
 */
export class StudioOverviewViewModelMapper {
  static toViewModel(overview: OrganizerOverview): StudioOverviewViewModel {
    const { kpis } = overview;

    return {
      kpis: {
        views: {
          label: "Vistas de eventos creados este mes",
          value: kpis.totalViews,
          previousValue: kpis.previousMonthViews,
          changePct: kpis.viewsChangePct,
        },
        registrations: {
          label: "Inscripciones de eventos creados este mes",
          value: kpis.totalRegistrations,
          previousValue: kpis.previousMonthRegistrations,
          changePct: kpis.registrationsChangePct,
        },
        likes: {
          label: "Likes de eventos creados este mes",
          value: kpis.totalLikes,
          previousValue: kpis.previousMonthLikes,
          changePct: kpis.likesChangePct,
        },
        activeEvents: {
          label: "Eventos activos",
          value: kpis.activeEvents,
          previousValue: kpis.previousMonthActiveEvents,
          changePct: kpis.activeEventsChangePct,
        },
      },
      conversion: overview.viewsVsRegistrations
        .map((p) => ({
          eventId: p.eventId,
          eventName: p.eventName,
          views: p.views,
          registrations: p.registrations,
          rate: p.views > 0 ? p.registrations / p.views : null,
        }))
        // Conversión desc; sin vistas al final; empate → más vistas primero.
        .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1) || b.views - a.views),
      registrationsTimeline: overview.registrationsTimeline.map((p) => ({
        date: p.date,
        registrations: p.registrations,
      })),
      topEvents: overview.topEvents.map((e) => ({
        eventId: e.eventId,
        name: e.name,
        score: e.score,
        views: e.views,
      })),
      interactivity: overview.interactivity.map((i) => ({
        eventName: i.eventName,
        views: i.views,
        likes: i.likes,
        shares: i.shares,
      })),
    };
  }
}
