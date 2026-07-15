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
  sessionId?: string,
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
    const id = eventId.trim();
    await eventInteractionsService.registerLike(
      id,
      tokens.decodedToken.uid,
      liked,
      sessionId,
    );

    // updateTag = read-your-own-writes: the next router.refresh() sees fresh data immediately
    if (sessionId) {
      updateTag(`event-interaction-${userId}-${id}-${sessionId}`);
      updateTag(`event-sessions-${id}`); // refresca el contador en la lista de sesiones
    } else {
      updateTag(`event-${id}`);
      updateTag(`event-interaction-${userId}-${id}`);
      updateTag(`preference-events-${userId}`);
      // revalidateTag (stale-while-revalidate) para el tab de Likes del perfil: una pequeña demora es aceptable
      revalidateTag(`profile-likes-${userId}`, "max");
    }

    return { success: true };
  } catch (error) {
    console.error("Error registering like interaction:", error);
    return { error: "No se pudo registrar el like. Intenta nuevamente." };
  }
}
