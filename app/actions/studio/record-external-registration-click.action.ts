"use server";

import { createServerContainer } from "@/infraestructure/di/container";

/**
 * Incrementa el contador de clicks del botón de registro externo.
 * No bloqueante: nunca lanza, para no entorpecer la redirección del usuario.
 */
export async function recordExternalRegistrationClickAction(eventId: string): Promise<void> {
  try {
    const { studioService } = createServerContainer();
    await studioService.incrementExternalRegistrationClick(eventId);
  } catch (error) {
    console.error("[EXTERNAL REGISTRATION CLICK ERROR]", error);
  }
}
