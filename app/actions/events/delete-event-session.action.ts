"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { syncEventDateRange } from "./lib/syncEventDateRange";
import { syncEventSiteIds } from "./lib/syncEventSiteIds";

type DeleteSessionResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteEventSessionAction(
  eventId: string,
  sessionId: string,
): Promise<DeleteSessionResult> {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid) {
    return { success: false, error: "Debes iniciar sesión." };
  }

  try {
    const { eventSessionService } = createServerContainer();
    await eventSessionService.deleteSession(eventId, sessionId);
    await syncEventDateRange(eventId);
    await syncEventSiteIds(eventId);
    updateTag(`event-sessions-${eventId}`);
    return { success: true };
  } catch (error) {
    console.error("deleteEventSessionAction error:", error);
    return { success: false, error: "Error al eliminar la sesión." };
  }
}
