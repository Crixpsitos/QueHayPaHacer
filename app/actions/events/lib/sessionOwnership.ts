import { revalidateTag, updateTag } from "next/cache";
import { getSessionUid, requireEventPermission } from "@/app/actions/_session";
import type { TeamAction } from "@/domain/entities/events/teamAccess";
import { createServerContainer } from "@/infraestructure/di/container";
import { syncEventDateRange } from "./syncEventDateRange";
import { syncEventSiteIds } from "./syncEventSiteIds";
import { siteLinkError } from "./siteLink";

/**
 * Guard de las actions de sesión: permiso sobre el evento padre (`edit_event` por defecto;
 * `publish_event` al publicar), evento multi-fecha y plan Premium del DUEÑO (multi-fecha es
 * exclusivo). Devuelve el mensaje de error o null.
 */
export async function sessionOwnerError(
  eventId: string,
  action: TeamAction = "edit_event",
): Promise<string | null> {
  const uid = await getSessionUid();
  if (!uid) return "Debes iniciar sesión.";
  // requireEventPermission exige el Premium del dueño (si es editor) o el propio (si es dueño).
  const access = await requireEventPermission(eventId, action);
  if (!access) return "No tienes permiso para modificar las sesiones de este evento.";
  const event = await createServerContainer().eventsService.getEventById(eventId);
  if (!event || event.eventType !== "multi-date") {
    return "Solo los eventos multi-fecha tienen sesiones.";
  }
  return null;
}

/**
 * Vínculo de la sesión con un sitio (`location.siteId`): mismo criterio que el evento único (sitio propio del DUEÑO
 * del evento), validado solo si el vínculo es nuevo o cambia respecto de la sesión guardada. Sin sitio no lee nada.
 */
export async function sessionSiteLinkError(
  eventId: string,
  nextSiteId: string | null | undefined,
  sessionId?: string | null,
): Promise<string | null> {
  if (!nextSiteId) return null;
  const { eventsService, eventSessionService } = createServerContainer();
  const [event, previous] = await Promise.all([
    eventsService.getEventById(eventId),
    sessionId ? eventSessionService.getById(eventId, sessionId) : null,
  ]);
  if (!event) return null; // el permiso sobre el evento ya lo comprobó sessionOwnerError
  return siteLinkError(event.author.id, nextSiteId, previous?.location?.siteId);
}

/** Tras mutar sesiones: re-sincroniza el evento padre e invalida sus cachés. */
export async function afterSessionChange(eventId: string): Promise<void> {
  await syncEventDateRange(eventId);
  await syncEventSiteIds(eventId);
  updateTag(`event-sessions-${eventId}`);
  // sync* reescriben fechas/siteIds del padre → detalle y listados.
  updateTag(`event-${eventId}`);
  revalidateTag("event-list", "max");
}
