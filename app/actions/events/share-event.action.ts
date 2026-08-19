"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { cookies } from "next/headers";

interface ShareEventActionResult {
  success?: boolean;
  authRequired?: boolean;
  error?: string;
}

/**
 * Registra un share del evento, o de una de sus fechas (`sessionId`).
 * A diferencia del like, un share es una ACCIÓN: compartir el evento y
 * compartir una fecha reparten dos enlaces distintos, así que ambos cuentan.
 */
export async function shareEventAction(
  eventId: string,
  sessionId?: string,
): Promise<ShareEventActionResult> {
  if (!eventId || !eventId.trim()) {
    return { error: "El id del evento es requerido." };
  }

  const tokens = await getTokens(await cookies(), authConfig);
  const userId = tokens?.decodedToken?.uid ?? "anonymous";

  try {
    const { eventInteractionsService } = createServerContainer();

    await eventInteractionsService.registerShare(
      eventId.trim(),
      userId,
      sessionId,
    );
    if (sessionId) updateTag(`event-sessions-${eventId.trim()}`);
    if (userId !== "anonymous") revalidateTag(`preference-events-${userId}`, "max");

    revalidatePath("/", "page");

    return { success: true };
  } catch (error) {
    console.error("Error registering share interaction:", error);
    return { error: "No se pudo registrar el share. Intenta nuevamente." };
  }
}
