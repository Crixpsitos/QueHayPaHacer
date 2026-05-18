"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";

interface LikeEventActionResult {
  success?: boolean;
  authRequired?: boolean;
  error?: string;
}

export async function likeEventAction(
  eventId: string,
  liked: boolean,
): Promise<LikeEventActionResult> {
  if (!eventId || !eventId.trim()) {
    return { error: "El id del evento es requerido." };
  }

  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid) {
    return { authRequired: true, error: "Debes iniciar sesion para dar like." };
  }

  try {
    const { eventInteractionsService } = createServerContainer();
    await eventInteractionsService.registerLike(
      eventId.trim(),
      tokens.decodedToken.uid,
      liked,
    );

    updateTag("featured-events");

    return { success: true };
  } catch (error) {
    console.error("Error registering like interaction:", error);
    return { error: "No se pudo registrar el like. Intenta nuevamente." };
  }
}
