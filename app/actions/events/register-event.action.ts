"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { updateTag } from "next/cache";
import { eventRegistrationConfirmedNotification, eventRegistrationNotification } from "@/domain/entities/notification/messages";
import { cookies } from "next/headers";

export interface RegisterEventActionInput {
  eventId: string;
  /** Registro a una sesión concreta (multi-date). */
  sessionId?: string;
  registrationType: "internal" | "form";
  formData?: Record<string, string | string[] | number | boolean | null | Record<string, unknown>>;
}

export interface RegisterEventActionResult {
  success?: boolean;
  authRequired?: boolean;
  alreadyRegistered?: boolean;
  error?: string;
}

export async function registerEventAction(
  input: RegisterEventActionInput,
): Promise<RegisterEventActionResult> {
  const { eventId, sessionId, registrationType, formData } = input;

  if (!eventId?.trim()) {
    return { error: "El id del evento es requerido." };
  }

  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken) {
    return { authRequired: true, error: "Debes iniciar sesión para registrarte." };
  }

  const { uid, name, email } = tokens.decodedToken;

  try {
    const { eventRegistrationService, eventsService, eventSessionService } = createServerContainer();

    // El organizador no puede inscribirse a su propio evento.
    const event = await eventsService.getEventById(eventId.trim());
    if (event?.author?.id && event.author.id === uid) {
      return { error: "No puedes inscribirte a tu propio evento." };
    }

    // Bloqueo temporal: eventos y sesiones ya finalizados no aceptan nuevos registros.
    if (sessionId) {
      const session = await eventSessionService.getById(eventId.trim(), sessionId);
      if (session && new Date(session.endDate).getTime() < Date.now()) {
        return { error: "Esta sesión ya finalizó y no acepta nuevos registros." };
      }
    } else if (event && new Date(event.endDate).getTime() < Date.now()) {
      return { error: "Este evento ya finalizó y no acepta nuevos registros." };
    }

    const alreadyRegistered = await eventRegistrationService.isUserRegistered(
      eventId.trim(),
      uid,
      sessionId,
    );
    if (alreadyRegistered) {
      return { alreadyRegistered: true };
    }

    await eventRegistrationService.registerUserToEvent({
      userId: uid,
      eventId: eventId.trim(),
      ...(sessionId ? { sessionId } : {}),
      name: name ?? "Usuario",
      email: email ?? "",
      registrationType,
      ...(formData ? { formData } : {}),
    });

    // Invalidate the event/session cache (analytics.registrations changed) and the per-user registration status
    if (sessionId) {
      updateTag(`event-sessions-${eventId.trim()}`);
      updateTag(`event-registration-${uid}-${eventId.trim()}-${sessionId}`);
    } else {
      updateTag(`event-${eventId.trim()}`);
      updateTag(`event-registration-${uid}-${eventId.trim()}`);
    }

    // Inscribirse (básica o con formulario) es el «Voy a ir» más claro: se marca solo (el like es del evento; si ya estaba marcado no suma otra vez).
    try {
      const { eventInteractionsService } = createServerContainer();
      await eventInteractionsService.registerLike(eventId.trim(), uid, true);
      updateTag(`event-interaction-${uid}-${eventId.trim()}`);
      updateTag(`preference-events-${uid}`);
    } catch (e) {
      console.warn("[register-event] no se pudo marcar «Voy a ir»:", e instanceof Error ? e.message : "error");
    }

    // Avisos (campanita, push y correo según sus preferencias): a quien organiza y a quien se inscribió. Nunca rompen la inscripción.
    try {
      if (event) {
        const { notifyUser } = createServerContainer();
        const ref = event.slug || event.id;
        const base = `${eventId.trim()}${sessionId ? `_${sessionId}` : ""}_${uid}`;
        const whenLabel = event.startDate ? new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(event.startDate)) : null;
        await Promise.all([
          event.author?.id ? notifyUser(event.author.id, eventRegistrationNotification({ title: event.title, ref, who: (name ?? "Alguien").slice(0, 40) }), `evreg_${base}`) : Promise.resolve(),
          notifyUser(uid, eventRegistrationConfirmedNotification({ title: event.title, ref, whenLabel }), `evregok_${base}`),
        ]);
      }
    } catch (e) {
      console.warn("[register-event] no se pudo avisar:", e instanceof Error ? e.message : "error");
    }

    return { success: true };
  } catch (error) {
    console.error("Error registering user to event:", error);
    return { error: "No se pudo completar el registro. Intenta nuevamente." };
  }
}
