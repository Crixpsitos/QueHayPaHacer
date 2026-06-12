"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";

export interface RegisterEventActionInput {
  eventId: string;
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
  const { eventId, registrationType, formData } = input;

  if (!eventId?.trim()) {
    return { error: "El id del evento es requerido." };
  }

  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken) {
    return { authRequired: true, error: "Debes iniciar sesión para registrarte." };
  }

  const { uid, name, email } = tokens.decodedToken;

  try {
    const { eventRegistrationService } = createServerContainer();

    const alreadyRegistered = await eventRegistrationService.isUserRegistered(
      eventId.trim(),
      uid,
    );
    if (alreadyRegistered) {
      return { alreadyRegistered: true };
    }

    await eventRegistrationService.registerUserToEvent({
      userId: uid,
      eventId: eventId.trim(),
      name: name ?? "Usuario",
      email: email ?? "",
      registrationType,
      ...(formData ? { formData } : {}),
    });

    // Invalidate the event cache (analytics.registrations changed) and the per-user registration status
    updateTag(`event-${eventId.trim()}`);
    updateTag(`event-registration-${uid}-${eventId.trim()}`);

    return { success: true };
  } catch (error) {
    console.error("Error registering user to event:", error);
    return { error: "No se pudo completar el registro. Intenta nuevamente." };
  }
}
