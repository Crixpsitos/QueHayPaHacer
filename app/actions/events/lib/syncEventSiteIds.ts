import { createServerContainer } from "@/infraestructure/di/container";
import { refreshSitesOfEvent } from "./refreshSites";

/**
 * Recalcula siteIds del evento multi-date desde sus sesiones publicadas
 * y lo persiste en el doc del evento para que el itinerario del sitio
 * pueda usar array-contains sin necesitar collectionGroup.
 */
export async function syncEventSiteIds(eventId: string): Promise<void> {
  const { eventSessionService, eventsService } = createServerContainer();
  const sessions = await eventSessionService.getByEventId(eventId);

  const siteIds = [
    ...new Set(
      sessions
        .filter((s) => s.status !== "cancelled" && s.location?.siteId)
        .map((s) => s.location!.siteId as string),
    ),
  ];

  const previous = await eventsService.syncSiteIds(eventId, siteIds);
  // Los sitios que ganan o pierden el evento (sesiones nuevas, movidas o canceladas) recuentan su agenda.
  await refreshSitesOfEvent([...previous, ...siteIds]);
}
