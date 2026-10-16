"use server"

import { getSessionUid } from "@/app/actions/_session"
import { createServerContainer } from "@/infraestructure/di/container"

// Sin caché: los avisos los crean también webhooks y Cloud Functions, que no pueden invalidar etiquetas de Next.
// Es una consulta de conteo (1 lectura facturable por hasta 1000 avisos).
/** Avisos sin leer del usuario en sesión. */
export async function getUnreadNotificationsCountAction(): Promise<number> {
  const uid = await getSessionUid()
  if (!uid) return 0
  try {
    return await createServerContainer().notificationService.countUnread(uid)
  } catch {
    return 0
  }
}
