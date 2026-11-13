"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { updateTag } from "next/cache";
import { studioRegistrationsTag } from "@/presentation/studio/lib/cachedStudioData";
import { payTiers } from "@/domain/entities/EventRegistration/payment";
import { cookies } from "next/headers";

/**
 * «Me interesa» en un evento con enlace externo (sin pasarela en QHPA): al pulsar el botón queda una inscripción pendiente para
 * que quien organiza vea cuánta gente está interesada y confirme quién fue o pagó. Silencioso: sin sesión, o si ya está, no hace nada.
 * Con capacidad definida el interés cuenta como cupo por 24 h; si ya está lleno, la persona queda en la lista de espera (`outcome`).
 * `tier` (opcional) es la categoría de entrada que dijo querer; solo se guarda si existe en el evento.
 */
export async function expressInterestAction(eventId: string, tier?: string): Promise<{ recorded: boolean; outcome?: "interested" | "waitlist"; position?: number | null }> {
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
    const chosen = tier && payTiers(event.price).some((t) => t.name === tier) ? tier : undefined;
    const r = await eventRegistrationService.registerExternalInterest({ userId: uid, eventId: id, name: name ?? "Usuario", email: email ?? "", registrationType: "internal", formData: { origen: "enlace externo", ...(chosen ? { categoria: chosen } : {}) } });
    if (!r.already && r.outcome === "interested") await eventInteractionsService.registerLike(id, uid, true).catch(() => undefined); // «Voy a ir»
    updateTag(`event-${id}`);
    updateTag(studioRegistrationsTag(id));
    updateTag(`event-registration-${uid}-${id}`);
    return { recorded: !r.already, outcome: r.outcome, position: r.position };
  } catch (e) {
    console.warn("[express-interest]", e instanceof Error ? e.message : "error");
    return { recorded: false };
  }
}
