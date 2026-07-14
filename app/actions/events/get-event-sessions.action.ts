"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import type { EventSession } from "@/domain/entities/events/EventSession";
import type { FormSessionDto } from "@/application/dto/events/EventSessionDto";

type GetSessionsResult =
  | { success: true; sessions: EventSession[] }
  | { success: false; error: string };

export async function getEventSessionsAction(
  eventId: string,
): Promise<GetSessionsResult> {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid) {
    return { success: false, error: "Debes iniciar sesión." };
  }

  try {
    const { eventSessionService } = createServerContainer();
    const sessions = await eventSessionService.getByEventId(eventId);
    return { success: true, sessions };
  } catch (error) {
    console.error("getEventSessionsAction error:", error);
    return { success: false, error: "Error al obtener las sesiones." };
  }
}
