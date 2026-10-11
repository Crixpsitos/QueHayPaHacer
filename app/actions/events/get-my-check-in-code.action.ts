"use server";

import { getSessionUid } from "@/app/actions/_session";
import { buildCheckInPayload, formatCheckInCode } from "@/domain/entities/EventRegistration/checkIn";
import { createServerContainer } from "@/infraestructure/di/container";

export interface MyCheckInCodeResult {
  /** `XXXX-XXXX-XXXX`, para dictar. */
  code?: string;
  /** Texto a codificar en el QR. */
  payload?: string;
  title?: string;
  authRequired?: boolean;
  error?: string;
}

const ERRORS = {
  not_found: "No encontramos tu inscripción.",
  canceled: "Tu inscripción está cancelada.",
  finished: "El evento ya finalizó.",
  no_attendance: "Este evento no usa código de asistencia.",
} as const;

/** El uid sale de la sesión: nunca se devuelve el código de otra persona. */
export async function getMyCheckInCodeAction(input: {
  eventId: string;
  sessionId?: string;
}): Promise<MyCheckInCodeResult> {
  const eventId = input.eventId?.trim();
  const sessionId = input.sessionId?.trim() || undefined;
  if (!eventId) return { error: "El id del evento es requerido." };

  const uid = await getSessionUid();
  if (!uid) return { authRequired: true, error: "Debes iniciar sesión." };

  try {
    const res = await createServerContainer().eventRegistrationService.getOrCreateCheckInCode(eventId, uid, sessionId);
    if (res.status !== "ok") return { error: ERRORS[res.status] };
    return {
      code: formatCheckInCode(res.code),
      payload: buildCheckInPayload({ eventId, sessionId, code: res.code }),
      title: res.title,
    };
  } catch (error) {
    console.error("[CHECK-IN CODE ERROR]", error);
    return { error: "No se pudo generar tu código. Intenta nuevamente." };
  }
}
