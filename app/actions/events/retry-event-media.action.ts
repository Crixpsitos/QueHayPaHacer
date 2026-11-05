"use server";

import { requireEventPermission } from "@/app/actions/_session";
import { createServerContainer } from "@/infraestructure/di/container";
import type { MediaItem } from "@/application/dto/events/EventDto";
import { decideRetry } from "./lib/decideRetry";

export type RetryEventMediaResult =
  | { success: true; status: "retriggered" }
  | { success: true; status: "already-ready"; item: MediaItem }
  | { success: false; error: string; code: "forbidden" | "not-found" | "missing-original" | "failed" };

/**
 * "Reintentar" de un medio atascado: reescribe el original en Storage para que el CF de optimización
 * se dispare de nuevo (ya con el item guardado). Idempotente: si el item ya está listo no hace nada.
 */
export async function retryEventMediaAction(eventId: string, mediaId: string): Promise<RetryEventMediaResult> {
  const access = await requireEventPermission(eventId, "edit_event", { ownerNeedsPremium: false });
  if (!access) return { success: false, code: "forbidden", error: "No tienes permiso para editar este evento." };

  const { eventsService, storageService } = createServerContainer();
  const event = await eventsService.getEventById(eventId);
  if (!event || event.author.id !== access.ownerId) {
    return { success: false, code: "forbidden", error: "No tienes permiso para editar este evento." };
  }

  const decision = decideRetry(eventId, event.media ?? [], mediaId);
  switch (decision.kind) {
    case "already-ready": {
      // El documento ya está listo pero el formulario sigue viendo "processing": devolver el item guardado.
      const item = event.media.find((m) => m.id === mediaId) as MediaItem;
      return { success: true, status: "already-ready", item: JSON.parse(JSON.stringify(item)) };
    }
    case "not-found":
      return { success: false, code: "not-found", error: "No encontramos ese archivo en el evento." };
    case "bad-path":
      return { success: false, code: "missing-original", error: "No pudimos recuperar este archivo. Vuelve a subirlo." };
  }

  try {
    if (!(await storageService.exists(decision.path))) {
      return { success: false, code: "missing-original", error: "El archivo original ya no existe. Vuelve a subirlo." };
    }
    await storageService.retrigger(decision.path);
    return { success: true, status: "retriggered" };
  } catch (error) {
    console.error("retryEventMedia failed:", error);
    return { success: false, code: "failed", error: "No se pudo reintentar. Inténtalo de nuevo en un momento." };
  }
}
