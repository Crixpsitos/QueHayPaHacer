"use server";

import { updateTag } from "next/cache";
import { createServerContainer } from "@/infraestructure/di/container";
import { studioRegistrationsTag } from "@/presentation/studio/lib/cachedStudioData";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function confirmAttendanceAction(
  eventId: string,
  userId: string,
  /** Si viene, la inscripción vive en `events/{id}/sessions/{sid}/registrations`. */
  sessionId?: string,
): Promise<ActionResult> {
  try {
    const { studioService } = createServerContainer();
    await studioService.confirmAttendance(eventId, userId, sessionId);
    // Solo cambia la fila (checkedInAt), no los contadores → basta con la tabla.
    updateTag(studioRegistrationsTag(eventId, sessionId));
    return { success: true };
  } catch (error) {
    console.error("[CONFIRM ATTENDANCE ERROR]", error);
    return { success: false, error: "No se pudo confirmar la asistencia." };
  }
}
