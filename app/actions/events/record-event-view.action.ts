"use server";

import { getSessionUid } from "@/app/actions/_session";
import { recordEventView } from "./_recordEventView";

/** El uid sale de la sesión, no del cliente (evita inflar vistas a nombre de otros). */
export async function recordEventViewAction(eventId: string): Promise<void> {
  const uid = await getSessionUid();
  if (uid) await recordEventView(eventId, uid);
}
