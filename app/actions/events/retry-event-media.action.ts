"use server";

import { requireEventPermission } from "@/app/actions/_session";
import { createServerContainer } from "@/infraestructure/di/container";
import { decideRetry } from "./lib/decideRetry";
import { applyRetry, type RetryEventMediaResult } from "./lib/applyRetry";

export type { RetryEventMediaResult };

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

  const media = event.media ?? [];
  return applyRetry(decideRetry(eventId, media, mediaId), storageService, media, mediaId);
}
