"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { safeParse } from "valibot";
import { afterSessionChange, sessionOwnerError } from "./lib/sessionOwnership";
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
  const ownerError = await sessionOwnerError(eventId);
  if (ownerError) return { success: false, error: ownerError };

  // El cliente solo puede guardar borrador o publicar; cancelled/ended no.
  if (data.status !== "draft" && data.status !== "published") {
    return { success: false, error: "Estado de sesión inválido." };
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
    // Persistir lo validado (result.output), no el payload crudo del cliente.
    const { session, hasOverlap } = await eventSessionService.createSession({
      ...result.output,
      media: result.output.media ?? [],
      startDate: new Date(result.output.startDate),
      endDate: new Date(result.output.endDate),
      eventId,
    });
    await afterSessionChange(eventId);
    return { success: true, session, hasOverlap };
  } catch (error) {
    if (error instanceof SessionOverlapError) {
      return { success: false, error: error.message };
    }
    console.error("createEventSessionAction error:", error);
    return { success: false, error: "Error al crear la sesión." };
  }
}
