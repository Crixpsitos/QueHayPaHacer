import type { OrganizerOverview } from "@/domain/entities/studio/Studio";
import type { StudioOverviewViewModel } from "../view-models/StudioOverviewViewModel";

/**
 * Mapper: entidad de dominio `OrganizerOverview` → `StudioOverviewViewModel`.
 * Listo para usarse cuando el `StudioService` devuelva datos reales.
 */
export class StudioOverviewViewModelMapper {
  static toViewModel(overview: OrganizerOverview): StudioOverviewViewModel {
    const { kpis } = overview;

    return {
      kpis: {
        views: {
          label: "Total de vistas",
          value: kpis.totalViews,
          previousValue: kpis.previousMonthViews,
          changePct: kpis.viewsChangePct,
        },
        registrations: {
          label: "Registros",
          value: kpis.totalRegistrations,
          previousValue: kpis.previousMonthRegistrations,
          changePct: kpis.registrationsChangePct,
        },
        likes: {
          label: "Likes",
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
      viewsVsRegistrations: overview.viewsVsRegistrations.map((p) => ({
        eventName: p.eventName,
        views: p.views,
        registrations: p.registrations,
      })),
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
