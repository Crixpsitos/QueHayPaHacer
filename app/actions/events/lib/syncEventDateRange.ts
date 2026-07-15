import { createServerContainer } from "@/infraestructure/di/container";

/**
 * Recalcula startDate/endDate del evento multi-date desde sus sesiones
 * (inicio más temprano → fin más tardío) y los persiste en el doc del evento.
 * Necesario porque los eventos multi-date no guardan fechas propias y las
 * consultas de listado filtran por startDate/endDate.
 */
export async function syncEventDateRange(eventId: string): Promise<void> {
  const { eventSessionService, eventsService } = createServerContainer();
  const sessions = await eventSessionService.getByEventId(eventId);
  await eventsService.syncDateRangeFromSessions(eventId, sessions);
}
