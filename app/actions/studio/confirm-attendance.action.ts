"use server";

import { createServerContainer } from "@/infraestructure/di/container";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function confirmAttendanceAction(
  eventId: string,
  userId: string,
): Promise<ActionResult> {
  try {
    const { studioService } = createServerContainer();
    await studioService.confirmAttendance(eventId, userId);
    return { success: true };
  } catch (error) {
    console.error("[CONFIRM ATTENDANCE ERROR]", error);
    return { success: false, error: "No se pudo confirmar la asistencia." };
  }
}
