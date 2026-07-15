"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { syncEventDateRange } from "./lib/syncEventDateRange";
import type { FormSessionDto } from "@/application/dto/events/EventSessionDto";
import type { EventSession } from "@/domain/entities/events/EventSession";

type SaveDraftSessionResult =
  | { success: true; session: EventSession }
  | { success: false; error: string };

/**
 * Guarda un borrador de sesión sin validación estricta.
 * Usado para obtener un sessionId antes de subir imágenes/media.
 */
export async function saveDraftSessionAction(
  eventId: string,
  data: FormSessionDto,
): Promise<SaveDraftSessionResult> {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid) {
    return { success: false, error: "Debes iniciar sesión." };
  }

  const payload = {
    eventId,
    title: data.title || "Borrador",
    shortDescription: data.shortDescription,
    description: data.description,
    coverSource: (data.coverSource ?? "parent") as EventSession["coverSource"],
    mainImage: data.mainImage,
    media: (data.media ?? []) as EventSession["media"],
    location: (data.location ?? {
      country: { isoCode: "", name: "", slug: "" },
      department: { isoCode: "", name: "", slug: "" },
      city: { name: "", slug: "" },
      venue: "",
      address: "",
      moreInfo: "",
      coordinates: { lat: 0, lng: 0 },
    }) as EventSession["location"],
    startDate: data.startDate ? new Date(data.startDate) : new Date(),
    endDate: data.endDate ? new Date(data.endDate) : new Date(Date.now() + 3_600_000),
    registrationType: (data.registrationType ?? "none") as EventSession["registrationType"],
    externalUrl: data.externalUrl,
    capacity: data.capacity,
    requiresAttendance: data.requiresAttendance,
    registrationEventForm: {
      fields: data.registrationEventForm?.fields ?? [],
    },
    price: (data.price ?? { isFree: true, amount: 0, currency: "COP" }) as EventSession["price"],
    status: "draft" as const,
  };

  try {
    const { eventSessionService } = createServerContainer();

    if (data.id) {
      const { session } = await eventSessionService.updateSession(eventId, data.id, payload);
      await syncEventDateRange(eventId);
      updateTag(`event-sessions-${eventId}`);
      return { success: true, session };
    }

    const { session } = await eventSessionService.createSession(payload);
    await syncEventDateRange(eventId);
    updateTag(`event-sessions-${eventId}`);
    return { success: true, session };
  } catch (error) {
    console.error("saveDraftSessionAction error:", error);
    return { success: false, error: "Error al guardar el borrador de la sesión." };
  }
}
