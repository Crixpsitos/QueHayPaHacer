"use server";

import { updateTag } from "next/cache";
import { createServerContainer } from "@/infraestructure/di/container";
import {
  studioMultiDateTag,
  studioRegistrationsTag,
  studioStatsTag,
} from "@/presentation/studio/lib/cachedStudioData";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function removeParticipantAction(
  eventId: string,
  userId: string,
  /** Si viene, la inscripción vive en `events/{id}/sessions/{sid}/registrations`. */
  sessionId?: string,
): Promise<ActionResult> {
  try {
    const { studioService } = createServerContainer();
    await studioService.removeParticipant(eventId, userId, sessionId);

    // El caché del Estudio es agresivo: sin invalidar, la tabla seguiría
    // mostrando al participante eliminado y el contador sin decrementar.
    updateTag(studioRegistrationsTag(eventId, sessionId));
    updateTag(studioStatsTag(eventId, sessionId));
    if (sessionId) updateTag(studioMultiDateTag(eventId));

    return { success: true };
  } catch (error) {
    console.error("[REMOVE PARTICIPANT ERROR]", error);
    return { success: false, error: "No se pudo quitar al participante." };
  }
}
