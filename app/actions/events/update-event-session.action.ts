"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { SessionOverlapError } from "@/application/services/events/EventSessionService";
import { syncEventDateRange } from "./lib/syncEventDateRange";
import { syncEventSiteIds } from "./lib/syncEventSiteIds";
import type { EventSession } from "@/domain/entities/events/EventSession";

type UpdateSessionResult =
  | { success: true; session: EventSession; hasOverlap: boolean }
  | { success: false; error: string };

export async function updateEventSessionAction(
  eventId: string,
  sessionId: string,
  data: Partial<Omit<EventSession, "id" | "eventId" | "createdAt">>,
): Promise<UpdateSessionResult> {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid) {
    return { success: false, error: "Debes iniciar sesión." };
  }

  try {
    const { eventSessionService } = createServerContainer();
    const { session, hasOverlap } = await eventSessionService.updateSession(
      eventId,
      sessionId,
      data,
    );
    await syncEventDateRange(eventId);
    await syncEventSiteIds(eventId);
    updateTag(`event-sessions-${eventId}`);
    return { success: true, session, hasOverlap };
  } catch (error) {
    if (error instanceof SessionOverlapError) {
      return { success: false, error: error.message };
    }
    console.error("updateEventSessionAction error:", error);
    return { success: false, error: "Error al actualizar la sesión." };
  }
}
