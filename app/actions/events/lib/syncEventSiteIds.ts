import { createServerContainer } from "@/infraestructure/di/container";

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

  await eventsService.syncSiteIds(eventId, siteIds);
}
