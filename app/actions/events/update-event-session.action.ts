"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { SessionOverlapError } from "@/application/services/events/EventSessionService";
import { afterSessionChange, sessionOwnerError } from "./lib/sessionOwnership";
import type { EventSession } from "@/domain/entities/events/EventSession";
import { SessionSchema } from "@/application/dto/events/EventSessionDto";
import { safeParse } from "valibot";

type UpdateSessionResult =
  | { success: true; session: EventSession; hasOverlap: boolean }
  | { success: false; error: string };

export async function updateEventSessionAction(
  eventId: string,
  sessionId: string,
  data: Partial<Omit<EventSession, "id" | "eventId" | "createdAt">>,
): Promise<UpdateSessionResult> {
  const ownerError = await sessionOwnerError(eventId, data?.status === "published" ? "publish_event" : "edit_event");
  if (ownerError) return { success: false, error: ownerError };

  // El cliente solo puede guardar borrador o publicar; cancelled/ended no.
  if (data.status !== "draft" && data.status !== "published") {
    return { success: false, error: "Estado de sesión inválido." };
  }

  const validation = safeParse(SessionSchema, {
    ...data,
    startDate: data.startDate instanceof Date
      ? data.startDate.toISOString()
      : data.startDate,
    endDate: data.endDate instanceof Date
      ? data.endDate.toISOString()
      : data.endDate,
  });

  if (!validation.success) {
    return {
      success: false,
      error: validation.issues.map((issue) => issue.message).join(", "),
    };
  }

  try {
    const { eventSessionService } = createServerContainer();
    // Persistir lo validado (no el payload crudo). El round-trip JSON sanea
    // campos que pueden llegar con proxies del cliente Firestore; las fechas
    // ya son string ISO en el output.
    const output = JSON.parse(JSON.stringify(validation.output)) as typeof validation.output;
    const { session, hasOverlap } = await eventSessionService.updateSession(
      eventId,
      sessionId,
      {
        ...output,
        startDate: new Date(output.startDate),
        endDate: new Date(output.endDate),
      },
    );
    await afterSessionChange(eventId);
    return { success: true, session, hasOverlap };
  } catch (error) {
    if (error instanceof SessionOverlapError) {
      return { success: false, error: error.message };
    }
    console.error("updateEventSessionAction error:", error);
    return { success: false, error: "Error al actualizar la sesión." };
  }
}
