"use server"

import { verifyUnsubscribeToken } from "@/domain/entities/email/unsubscribeToken"
import { createServerContainer } from "@/infraestructure/di/container"

/** Confirmar la baja desde la página `/baja` (el enlace del correo lleva uid y firma). */
export async function unsubscribeFromEmailAction(uid: string, token: string): Promise<{ success: boolean; error?: string }> {
  if (typeof uid !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(uid) || !verifyUnsubscribeToken(uid, token, process.env.EMAIL_UNSUBSCRIBE_SECRET)) return { success: false, error: "Este enlace no es válido o ya venció." }
  await createServerContainer().notificationPrefsService.unsubscribe(uid)
  return { success: true }
}
