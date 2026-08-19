import type { EventStats } from "@/domain/entities/studio/Studio";
import type { EventStatsViewModel } from "../view-models/StudioEventsViewModel";

/**
 * Convierte el dominio `EventStats` al ViewModel de presentación.
 * `team` viene de colaboradores (consulta aparte); por ahora va vacío.
 */
export function toEventStatsViewModel(stats: EventStats): EventStatsViewModel {
  return {
    eventId: stats.eventId,
    name: stats.name,
    status: stats.status,
    date: stats.date.toISOString(),
    registrationType: stats.registrationType,
    views: stats.views,
    registrations: stats.registrations,
    clicks: stats.clicks,
    likes: stats.likes,
    shares: stats.shares,
    score: stats.score,
    rampUnit: stats.rampUnit,
    registrationRamp: stats.registrationRamp,
    team: [],
  };
}
