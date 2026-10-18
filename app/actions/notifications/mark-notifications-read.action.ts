"use server"

import { getSessionUid } from "@/app/actions/_session"
import { createServerContainer } from "@/infraestructure/di/container"

/** Marca como leídos todos los avisos del usuario en sesión. */
export async function markNotificationsReadAction(): Promise<void> {
  const uid = await getSessionUid()
  if (!uid) return
  try {
    await createServerContainer().notificationService.markAllRead(uid)
  } catch (e) {
    console.error("[markNotificationsRead]", e)
  }
}
