"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";

interface ShareEventActionResult {
  success?: boolean;
  authRequired?: boolean;
  error?: string;
}

export async function shareEventAction(
  eventId: string,
): Promise<ShareEventActionResult> {
  if (!eventId || !eventId.trim()) {
    return { error: "El id del evento es requerido." };
  }

  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid) {
    return { authRequired: true, error: "Debes iniciar sesion para compartir." };
  }

  try {
    const { eventInteractionsService } = createServerContainer();
    
    await eventInteractionsService.registerShare(
      eventId.trim(),
      tokens.decodedToken.uid,
    );

    updateTag("featured-events");

    return { success: true };
  } catch (error) {
    console.error("Error registering share interaction:", error);
    return { error: "No se pudo registrar el share. Intenta nuevamente." };
  }
}
