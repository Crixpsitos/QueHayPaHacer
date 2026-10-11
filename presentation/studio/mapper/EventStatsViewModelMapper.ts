import type { EventAccessRole } from "@/domain/entities/events/teamAccess";
import { permissionsFor } from "@/domain/entities/events/teamPolicy";
import type { EventStats } from "@/domain/entities/studio/Studio";
import type { EventStatsViewModel } from "../view-models/StudioEventsViewModel";

/**
 * Convierte el dominio `EventStats` al ViewModel de presentación.
 */
export function toEventStatsViewModel(stats: EventStats, viewerRole: EventAccessRole): EventStatsViewModel {
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
    viewerRole,
    permissions: permissionsFor(viewerRole),
  };
}
