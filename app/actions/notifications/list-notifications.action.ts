"use server"

import { getSessionUid } from "@/app/actions/_session"
import { createServerContainer } from "@/infraestructure/di/container"
import type { NotificationItem } from "@/domain/entities/notification/Notification"

/** Últimos avisos del usuario en sesión (los más recientes primero). */
export async function listNotificationsAction(): Promise<{ success: true; items: NotificationItem[] } | { success: false }> {
  const uid = await getSessionUid()
  if (!uid) return { success: false }
  try {
    return { success: true, items: await createServerContainer().notificationService.list(uid) }
  } catch (e) {
    console.error("[listNotifications]", e)
    return { success: false }
  }
}
