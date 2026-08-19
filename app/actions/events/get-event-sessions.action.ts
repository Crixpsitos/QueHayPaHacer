"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import type { EventSession } from "@/domain/entities/events/EventSession";

type GetEventSessionsResult =
  | { success: true; sessions: EventSession[] }
  | { success: false; error: string };

/** Devuelve las sesiones de un evento (usado por el diálogo de conversión multi→standard). */
export async function getEventSessionsAction(
  eventId: string,
): Promise<GetEventSessionsResult> {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid) {
    return { success: false, error: "Debes iniciar sesión." };
  }

  try {
    const { eventSessionService } = createServerContainer();
    const sessions = await eventSessionService.getByEventId(eventId);
    return { success: true, sessions };
  } catch (err) {
    console.error("getEventSessionsAction error:", err);
    return { success: false, error: "No se pudieron obtener las sesiones." };
  }
}
