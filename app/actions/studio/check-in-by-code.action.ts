"use server";

import { updateTag } from "next/cache";
import { isStudioEventOwner } from "@/app/actions/_session";
import { parseCheckInPayload } from "@/domain/entities/EventRegistration/checkIn";
import { createServerContainer } from "@/infraestructure/di/container";
import { studioRegistrationsTag } from "@/presentation/studio/lib/cachedStudioData";

export interface CheckInByCodeActionResult {
  success: boolean;
  alreadyConfirmed?: boolean;
  name?: string;
  error?: string;
}

const ERRORS = {
  not_found: "Código no válido para este evento.",
  canceled: "Esta inscripción está cancelada.",
  no_attendance: "Este evento no usa control de asistencia.",
} as const;

/**
 * Check-in por QR o código escrito. Mismo guard que confirmAttendanceAction
 * (Premium + autor). `eventId`/`sessionId` son los de la pantalla del Studio.
 */
export async function checkInByCodeAction(input: {
  eventId: string;
  sessionId?: string;
  input: string;
}): Promise<CheckInByCodeActionResult> {
  const eventId = input.eventId?.trim();
  const sessionId = input.sessionId?.trim() || undefined;
  try {
    if (!eventId || !(await isStudioEventOwner(eventId))) return { success: false, error: "No autorizado." };

    const parsed = typeof input.input === "string" ? parseCheckInPayload(input.input) : null;
    if (!parsed) return { success: false, error: "No reconocemos ese código." };
    // El QR trae su evento/sesión: si no coinciden con la pantalla, es de otro.
    if (parsed.eventId !== undefined && parsed.eventId !== eventId) {
      return { success: false, error: "Este QR es de otro evento." };
    }
    if (parsed.sessionId !== undefined && (parsed.sessionId ?? undefined) !== sessionId) {
      return { success: false, error: "Este QR es de otra sesión." };
    }

    const res = await createServerContainer().studioService.checkInByCode(eventId, parsed.code, sessionId);
    if (res.result !== "ok" && res.result !== "already") return { success: false, error: ERRORS[res.result] };
    if (res.result === "ok") updateTag(studioRegistrationsTag(eventId, sessionId));
    return { success: true, name: res.name, ...(res.result === "already" ? { alreadyConfirmed: true } : {}) };
  } catch (error) {
    console.error("[CHECK-IN BY CODE ERROR]", error);
    return { success: false, error: "No se pudo confirmar la asistencia." };
  }
}
