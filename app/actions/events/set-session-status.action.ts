"use server";

import * as v from "valibot";
import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { SessionSchema } from "@/application/dto/events/EventSessionDto";
import { syncEventDateRange } from "./lib/syncEventDateRange";
import { SESSION_OVERLAP_MESSAGE } from "@/application/services/events/EventSessionService";
import type { EventSession } from "@/domain/entities/events/EventSession";

type SetStatusResult =
  | { success: true; session: EventSession; hasOverlap: boolean }
  | { success: false; error: string };

/**
 * Cambia el estado de una sesión sin abrir el formulario.
 * - "published": exige que la sesión esté completa (valida SessionSchema).
 * - "draft": libre (pasar de publicada a borrador siempre se permite).
 */
export async function setSessionStatusAction(
  eventId: string,
  sessionId: string,
  status: "draft" | "published",
): Promise<SetStatusResult> {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid) {
    return { success: false, error: "Debes iniciar sesión." };
  }

  try {
    const { eventSessionService } = createServerContainer();

    if (status === "published") {
      const session = await eventSessionService.getById(eventId, sessionId);
      if (!session) return { success: false, error: "Sesión no encontrada." };

      const payload = {
        title: session.title,
        shortDescription: session.shortDescription,
        description: session.description,
        coverSource: session.coverSource,
        mainImage: session.mainImage,
        media: session.media ?? [],
        location: session.location,
        startDate: new Date(session.startDate).toISOString(),
        endDate: new Date(session.endDate).toISOString(),
        registrationType: session.registrationType,
        externalUrl: session.externalUrl,
        capacity: session.capacity,
        requiresAttendance: session.requiresAttendance,
        registrationEventForm: session.registrationEventForm ?? { fields: [] },
        price: session.price,
        status: "published" as const,
      };

      const parsed = v.safeParse(SessionSchema, payload);
      if (!parsed.success) {
        return {
          success: false,
          error:
            parsed.issues[0]?.message ??
            "La sesión está incompleta. Edítala para completarla antes de publicar.",
        };
      }

      // Bloquear si colisiona en horario con otra sesión (updateSession de abajo
      // solo cambia el estado, no lleva fechas → no revalida el solapamiento).
      const overlaps = await eventSessionService.checkOverlap(
        eventId,
        new Date(session.startDate),
        new Date(session.endDate),
        sessionId,
      );
      if (overlaps) {
        return { success: false, error: SESSION_OVERLAP_MESSAGE };
      }
    }

    const { session, hasOverlap } = await eventSessionService.updateSession(
      eventId,
      sessionId,
      { status },
    );
    await syncEventDateRange(eventId);
    updateTag(`event-sessions-${eventId}`);
    return { success: true, session, hasOverlap };
  } catch (error) {
    console.error("setSessionStatusAction error:", error);
    return { success: false, error: "No se pudo cambiar el estado de la sesión." };
  }
}
