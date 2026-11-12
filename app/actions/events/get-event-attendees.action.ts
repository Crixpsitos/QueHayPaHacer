"use server";

import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { payTiers, type PayTier } from "@/domain/entities/EventRegistration/payment";
import { createServerContainer } from "@/infraestructure/di/container";

/** Asistente serializable para el modal de inscritos. */
export interface EventAttendeeVM {
  userId: string;
  /** Nombre completo a mostrar. */
  name: string;
  /** "@handle" sutil (solo creadores). */
  handle?: string;
  isCreator: boolean;
  photoURL?: string;
  /** ISO 8601. */
  registeredAt: string;
  attendanceConfirmed: boolean;
  tier?: string;
  paidAmount?: number;
  /** Persona sin cuenta agregada por quien organiza. */
  isGuest: boolean;
}

export type GetEventAttendeesResult =
  | {
      success: true;
      attendees: EventAttendeeVM[];
      /** Cursor para "cargar más"; `null` si no hay más páginas. */
      nextCursor: string | null;
      /** Si el evento lleva control de asistencia (check-in). */
      requiresAttendance: boolean;
      /** Total de inscritos (contador denormalizado del evento). */
      total: number;
      /** Evento con enlace externo: los inscritos son «interesados» y quien organiza confirma quién fue o pagó. */
      isExternal: boolean;
      /** Cupo del evento, si lo definió. */
      capacity?: number;
      /** Categorías cobrables (vacío = gratis). */
      tiers: PayTier[];
    }
  | { success: false; error: string };

const PAGE_SIZE = 20;

/**
 * Lista paginada de inscritos a un evento, pensada para que el ORGANIZADOR
 * (cualquier cuenta, también las no Premium) vea quién asiste sin entrar
 * al Estudio. Reutiliza el pipeline del Studio pero exige ser dueño del evento.
 */
export async function getEventAttendeesAction(
  eventId: string,
  cursor?: string,
): Promise<GetEventAttendeesResult> {
  if (!eventId?.trim()) {
    return { success: false, error: "Evento inválido." };
  }

  const tokens = await getTokens(await cookies(), authConfig);
  const uid = tokens?.decodedToken?.uid;
  if (!uid) {
    return { success: false, error: "Debes iniciar sesión." };
  }

  try {
    const { eventsService, studioService } = createServerContainer();

    const event = await eventsService.getEventById(eventId.trim());
    if (!event) {
      return { success: false, error: "El evento no existe." };
    }
    // Solo el organizador puede ver la lista de inscritos.
    if (event.author?.id !== uid) {
      return { success: false, error: "No tienes acceso a los inscritos de este evento." };
    }

    const result = await studioService.getEventRegistrations(eventId.trim(), {
      sortBy: "registeredAt",
      sortDir: "desc",
      limit: PAGE_SIZE,
      cursor,
      direction: "next",
    });

    if (!result) {
      return {
        success: true,
        attendees: [],
        nextCursor: null,
        requiresAttendance: (event.requiresAttendance ?? false) || event.registrationType === "external",
        total: event.analytics?.registrations ?? 0,
        isExternal: event.registrationType === "external",
        capacity: event.capacity,
        tiers: payTiers(event.price),
      };
    }

    const attendees: EventAttendeeVM[] = result.registrations.map((r) => {
      const fullName = `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim();
      return {
        userId: r.userId,
        name: fullName || r.displayName || "Sin nombre",
        handle: r.isCreator && fullName && r.displayName ? r.displayName : undefined,
        isCreator: r.isCreator,
        photoURL: r.photoURL,
        registeredAt: r.registeredAt.toISOString(),
        attendanceConfirmed: r.attendanceConfirmed,
        tier: r.tier,
        paidAmount: r.paidAmount,
        isGuest: r.isGuest === true,
      };
    });

    return {
      success: true,
      attendees,
      nextCursor: result.nextCursor,
      requiresAttendance: result.requiresAttendance || event.registrationType === "external",
      total: event.analytics?.registrations ?? attendees.length,
      isExternal: event.registrationType === "external",
      capacity: event.capacity,
      tiers: payTiers(event.price),
    };
  } catch (error) {
    console.error("getEventAttendeesAction error", { eventId, error });
    return { success: false, error: "No se pudieron cargar los inscritos." };
  }
}
