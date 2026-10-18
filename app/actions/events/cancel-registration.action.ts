"use server";

import { updateTag } from "next/cache";
import { getSessionUid } from "@/app/actions/_session";
import { createServerContainer } from "@/infraestructure/di/container";
import {
  studioMultiDateTag,
  studioRegistrationsTag,
  studioStatsTag,
} from "@/presentation/studio/lib/cachedStudioData";

export interface CancelRegistrationInput {
  eventId: string;
  /** Inscripción a una sesión concreta (multi-date). */
  sessionId?: string;
}

export interface CancelRegistrationActionResult {
  success?: boolean;
  authRequired?: boolean;
  error?: string;
}

const ERRORS = {
  not_found: "No encontramos esa inscripción.",
  canceled: "Esta inscripción ya estaba cancelada.",
  finished: "El evento ya finalizó; no se puede cancelar.",
  attended: "Tu asistencia ya fue confirmada; no se puede cancelar.",
} as const;

/** El uid sale de la sesión: solo se puede cancelar la inscripción propia. */
export async function cancelRegistrationAction(
  input: CancelRegistrationInput,
): Promise<CancelRegistrationActionResult> {
  const eventId = input.eventId?.trim();
  const sessionId = input.sessionId?.trim() || undefined;
  if (!eventId) return { error: "El id del evento es requerido." };

  const uid = await getSessionUid();
  if (!uid) return { authRequired: true, error: "Debes iniciar sesión." };

  try {
    const result = await createServerContainer().eventRegistrationService.cancelRegistration(
      eventId,
      uid,
      sessionId,
    );
    if (result !== "ok") return { error: ERRORS[result] };

    // Mismas etiquetas que register-event: contador público y estado "inscrito" del usuario.
    if (sessionId) {
      updateTag(`event-sessions-${eventId}`);
      updateTag(`event-registration-${uid}-${eventId}-${sessionId}`);
    } else {
      updateTag(`event-${eventId}`);
      updateTag(`event-registration-${uid}-${eventId}`);
    }
    // Studio del organizador: la inscrita deja de contar como asistente.
    updateTag(studioRegistrationsTag(eventId, sessionId));
    updateTag(studioStatsTag(eventId, sessionId));
    if (sessionId) updateTag(studioMultiDateTag(eventId));
    return { success: true };
  } catch (error) {
    console.error("Error canceling registration:", error);
    return { error: "No se pudo cancelar la inscripción. Intenta nuevamente." };
  }
}
