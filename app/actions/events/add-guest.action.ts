"use server";

import { requireEventPermission } from "@/app/actions/_session";
import { createServerContainer } from "@/infraestructure/di/container";
import { SITE_URL } from "@/app/lib/site";
import { entryMessage, entryPath } from "@/domain/entities/EventRegistration/guest";
import { updateTag } from "next/cache";

export type AddGuestResult =
  | { success: true; name: string; url: string; whatsappHref: string }
  | { success: false; error: string };

/**
 * Quien organiza agrega a mano a alguien SIN cuenta (se inscribió por WhatsApp, llegó a la puerta…): queda inscrita con su código
 * y su QR. Devuelve el enlace de la entrada (página pública, sin sesión) y un botón de WhatsApp con el mensaje listo.
 * Solo el dueño o su equipo con permiso de confirmar asistencia; cualquier cuenta, sin Premium.
 */
export async function addGuestAction(eventId: string, input: { name: string; phone?: string }): Promise<AddGuestResult> {
  const id = eventId?.trim();
  if (!id || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) return { success: false, error: "Evento inválido." };
  const access = await requireEventPermission(id, "confirm_attendance", { ownerNeedsPremium: false });
  if (!access) return { success: false, error: "No tienes permiso en este evento." };
  try {
    const { eventGuestService, eventsService } = createServerContainer();
    const event = await eventsService.getEventById(id);
    if (!event) return { success: false, error: "El evento no existe." };
    if (event.registrationType === "none") return { success: false, error: "Este evento no lleva inscripción." };
    const r = await eventGuestService.add(id, access.uid, input);
    if (!r.ok) return { success: false, error: r.error };
    updateTag(`event-${id}`);
    const url = `${SITE_URL}${entryPath(id, r.code)}`;
    const text = encodeURIComponent(entryMessage({ name: r.name, eventTitle: event.title, url }));
    return { success: true, name: r.name, url, whatsappHref: r.phone ? `https://wa.me/57${r.phone}?text=${text}` : `https://wa.me/?text=${text}` };
  } catch (e) {
    console.error("[add-guest]", e instanceof Error ? e.message : "error");
    return { success: false, error: "No se pudo agregar. Intenta de nuevo." };
  }
}
