"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { afterSessionChange, sessionOwnerError } from "./lib/sessionOwnership";

type DeleteSessionResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteEventSessionAction(
  eventId: string,
  sessionId: string,
): Promise<DeleteSessionResult> {
  const ownerError = await sessionOwnerError(eventId);
  if (ownerError) return { success: false, error: ownerError };

  try {
    const { eventSessionService } = createServerContainer();
    await eventSessionService.deleteSession(eventId, sessionId);
    await afterSessionChange(eventId);
    return { success: true };
  } catch (error) {
    console.error("deleteEventSessionAction error:", error);
    return { success: false, error: "Error al eliminar la sesión." };
  }
}
