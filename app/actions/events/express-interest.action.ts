"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";

/**
 * «Me interesa» en un evento con enlace externo (sin pasarela en QHPA): al pulsar el botón queda una inscripción pendiente para
 * que quien organiza vea cuánta gente está interesada y confirme quién fue o pagó. Silencioso: sin sesión, o si ya está, no hace nada.
 */
export async function expressInterestAction(eventId: string): Promise<{ recorded: boolean }> {
  const id = eventId?.trim();
  if (!id) return { recorded: false };
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken) return { recorded: false };
  const { uid, name, email } = tokens.decodedToken;
  try {
    const { eventRegistrationService, eventsService, eventInteractionsService } = createServerContainer();
    const event = await eventsService.getEventById(id);
    if (!event || event.registrationType !== "external" || event.author?.id === uid) return { recorded: false };
    if (new Date(event.endDate).getTime() < Date.now()) return { recorded: false };
    if (await eventRegistrationService.isUserRegistered(id, uid)) return { recorded: false };
    await eventRegistrationService.registerUserToEvent({ userId: uid, eventId: id, name: name ?? "Usuario", email: email ?? "", registrationType: "internal", formData: { origen: "enlace externo" } });
    await eventInteractionsService.registerLike(id, uid, true).catch(() => undefined); // «Voy a ir»
    updateTag(`event-${id}`);
    updateTag(`event-registration-${uid}-${id}`);
    return { recorded: true };
  } catch (e) {
    console.warn("[express-interest]", e instanceof Error ? e.message : "error");
    return { recorded: false };
  }
}
