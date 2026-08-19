"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { revalidateTag, updateTag } from "next/cache";

type DeleteEventResult = { success: true } | { success: false; error: string };

export async function deleteEventAction(eventId: string): Promise<DeleteEventResult> {
  const tokens = await getTokens(await cookies(), authConfig);
  const uid = tokens?.decodedToken?.uid;
  if (!uid) return { success: false, error: "Debes iniciar sesión." };
  if (!eventId?.trim()) return { success: false, error: "ID de evento inválido." };

  try {
    const { eventsService } = createServerContainer();

    // Verificar propiedad antes de borrar
    const event = await eventsService.getEventById(eventId.trim());
    if (!event) return { success: false, error: "El evento no existe." };
    if (event.author?.id !== uid) return { success: false, error: "No tienes permiso para eliminar este evento." };

    await eventsService.deleteEvent(eventId.trim());

    updateTag("event-list");
    revalidateTag("explore", "max");
    revalidateTag(`profile-events-${uid}`, "max");
    revalidateTag(`event-${eventId}`, "max");

    return { success: true };
  } catch (error) {
    console.error("deleteEventAction error:", error);
    return { success: false, error: "No se pudo eliminar el evento." };
  }
}
