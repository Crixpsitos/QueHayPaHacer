import { revalidateTag, updateTag } from "next/cache";
import { getSessionUid } from "@/app/actions/_session";
import { createServerContainer } from "@/infraestructure/di/container";
import { syncEventDateRange } from "./syncEventDateRange";
import { syncEventSiteIds } from "./syncEventSiteIds";

/**
 * Guard de las actions de sesión: autor del evento padre, evento multi-fecha y
 * plan Premium (multi-fecha es exclusivo). Devuelve el mensaje de error o null.
 */
export async function sessionOwnerError(eventId: string): Promise<string | null> {
  const uid = await getSessionUid();
  if (!uid) return "Debes iniciar sesión.";
  const { eventsService, userService } = createServerContainer();
  const [event, user] = await Promise.all([
    eventsService.getEventById(eventId),
    userService.getUserById(uid),
  ]);
  if (!event || event.author.id !== uid) {
    return "No tienes permiso para modificar las sesiones de este evento.";
  }
  if (event.eventType !== "multi-date") {
    return "Solo los eventos multi-fecha tienen sesiones.";
  }
  if (user?.plan !== "premium") {
    return "Los eventos multi-fecha son exclusivos del plan Premium.";
  }
  return null;
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
