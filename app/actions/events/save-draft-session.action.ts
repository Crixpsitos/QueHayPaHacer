"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { afterSessionChange, sessionOwnerError, sessionSiteLinkError } from "./lib/sessionOwnership";
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
  const ownerError = await sessionOwnerError(eventId);
  if (ownerError) return { success: false, error: ownerError };
  const linkError = await sessionSiteLinkError(eventId, data.location?.siteId, data.id);
  if (linkError) return { success: false, error: linkError };

  const payload = {
    eventId,
    title: data.title || "Borrador",
    description: data.description !== undefined
      ? JSON.parse(JSON.stringify(data.description))
      : undefined,
    coverSource: (data.coverSource ?? "parent") as EventSession["coverSource"],
    mainImage: data.mainImage !== undefined
      ? JSON.parse(JSON.stringify(data.mainImage))
      : undefined,
    media: JSON.parse(JSON.stringify(data.media ?? [])) as EventSession["media"],
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
      await afterSessionChange(eventId);
      return { success: true, session };
    }

    const { session } = await eventSessionService.createSession(payload);
    await afterSessionChange(eventId);
    return { success: true, session };
  } catch (error) {
    console.error("saveDraftSessionAction error:", error);
    return { success: false, error: "Error al guardar el borrador de la sesión." };
  }
}
