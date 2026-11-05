"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { decideRetry, sessionScope } from "./lib/decideRetry";
import { applyRetry, type RetryEventMediaResult } from "./lib/applyRetry";
import { sessionOwnerError } from "./lib/sessionOwnership";

export type { RetryEventMediaResult };

/** "Reintentar" de un medio atascado en la galería de una sesión multi-fecha (ver retryEventMediaAction). */
export async function retrySessionMediaAction(
  eventId: string,
  sessionId: string,
  mediaId: string,
): Promise<RetryEventMediaResult> {
  const ownerError = await sessionOwnerError(eventId);
  if (ownerError) return { success: false, code: "forbidden", error: ownerError };

  const { eventSessionService, storageService } = createServerContainer();
  const session = await eventSessionService.getById(eventId, sessionId);
  if (!session) return { success: false, code: "not-found", error: "No encontramos la sesión." };

  const media = session.media ?? [];
  return applyRetry(decideRetry(eventId, media, mediaId, sessionScope(sessionId)), storageService, media, mediaId);
}
