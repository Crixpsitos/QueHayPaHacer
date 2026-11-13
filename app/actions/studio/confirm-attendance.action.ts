"use server";

import { requireEventPermission } from "@/app/actions/_session";

import { updateTag } from "next/cache";
import { createServerContainer } from "@/infraestructure/di/container";
import { resolvePayment } from "@/domain/entities/EventRegistration/payment";
import { studioRegistrationsTag } from "@/presentation/studio/lib/cachedStudioData";

interface ActionResult {
  success: boolean;
  error?: string;
  /** Lo cobrado al confirmar (para sumar a «Ha entrado» sin releer las inscripciones). */
  paid?: { tier: string | null; amount: number };
}

export async function confirmAttendanceAction(
  eventId: string,
  userId: string,
  /** Si viene, la inscripción vive en `events/{id}/sessions/{sid}/registrations`. */
  sessionId?: string,
  /** Eventos externos de pago: categoría que pagó (el valor sale del precio del evento). */
  tier?: string,
): Promise<ActionResult> {
  try {
    const access = await requireEventPermission(eventId, "confirm_attendance", { ownerNeedsPremium: false });
    if (!access) return { success: false, error: "No autorizado." };
    const { studioService, eventsService } = createServerContainer();
    let payment: { tier: string | null; amountCop: number } | undefined;
    if (!sessionId) {
      const event = await eventsService.getEventById(eventId);
      if (event?.registrationType === "external") {
        const p = resolvePayment(event.price, tier);
        if (!p) return { success: false, error: "Esa categoría no existe en el evento." };
        payment = p;
      }
    }
    await studioService.confirmAttendance(eventId, userId, sessionId, access.uid, payment);
    // Solo cambia la fila (checkedInAt), no los contadores → basta con la tabla.
    updateTag(studioRegistrationsTag(eventId, sessionId));
    updateTag(`event-income-${eventId}`);
    return { success: true, ...(payment && payment.amountCop > 0 ? { paid: { tier: payment.tier, amount: payment.amountCop } } : {}) };
  } catch (error) {
    console.error("[CONFIRM ATTENDANCE ERROR]", error);
    return { success: false, error: "No se pudo confirmar la asistencia." };
  }
}
