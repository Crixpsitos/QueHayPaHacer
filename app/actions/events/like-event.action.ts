"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { revalidateTag, updateTag } from "next/cache";
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
  const userId = tokens?.decodedToken?.uid;
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

    // updateTag = read-your-own-writes: the next router.refresh() sees fresh data immediately
    updateTag(`event-${eventId.trim()}`);
    updateTag(`event-interaction-${userId}-${eventId.trim()}`);
    updateTag(`preference-events-${userId}`);

    // revalidateTag (stale-while-revalidate) para el tab de Likes del perfil: una pequeña demora es aceptable
    revalidateTag(`profile-likes-${userId}`, "max");

    return { success: true };
  } catch (error) {
    console.error("Error registering like interaction:", error);
    return { error: "No se pudo registrar el like. Intenta nuevamente." };
  }
}
