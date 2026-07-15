"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { safeParse } from "valibot";
import { syncEventDateRange } from "./lib/syncEventDateRange";
import { SessionSchema } from "@/application/dto/events/EventSessionDto";
import { SessionOverlapError } from "@/application/services/events/EventSessionService";
import type { EventSession } from "@/domain/entities/events/EventSession";

type CreateSessionResult =
  | { success: true; session: EventSession; hasOverlap: boolean }
  | { success: false; error: string };

export async function createEventSessionAction(
  eventId: string,
  data: Omit<EventSession, "id" | "eventId" | "createdAt" | "updatedAt">,
): Promise<CreateSessionResult> {
  const tokens = await getTokens(await cookies(), authConfig);
  const userId = tokens?.decodedToken?.uid;
  if (!userId) {
    return { success: false, error: "Debes iniciar sesión." };
  }

  // Validate with full schema before saving
  const result = safeParse(SessionSchema, {
    ...data,
    startDate: data.startDate instanceof Date
      ? data.startDate.toISOString()
      : data.startDate,
    endDate: data.endDate instanceof Date
      ? data.endDate.toISOString()
      : data.endDate,
  });

  if (!result.success) {
    console.error("createEventSessionAction validation:", result.issues);
    return {
      success: false,
      error: result.issues.map((i) => i.message).join(", "),
    };
  }

  try {
    const { eventSessionService } = createServerContainer();
    const { session, hasOverlap } = await eventSessionService.createSession({
      ...data,
      eventId,
    });
    await syncEventDateRange(eventId);
    updateTag(`event-sessions-${eventId}`);
    return { success: true, session, hasOverlap };
  } catch (error) {
    if (error instanceof SessionOverlapError) {
      return { success: false, error: error.message };
    }
    console.error("createEventSessionAction error:", error);
    return { success: false, error: "Error al crear la sesión." };
  }
}
