"use server";

import { createServerContainer } from "@/infraestructure/di/container";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function removeParticipantAction(
  eventId: string,
  userId: string,
): Promise<ActionResult> {
  try {
    const { studioService } = createServerContainer();
    await studioService.removeParticipant(eventId, userId);
    return { success: true };
  } catch (error) {
    console.error("[REMOVE PARTICIPANT ERROR]", error);
    return { success: false, error: "No se pudo quitar al participante." };
  }
}
