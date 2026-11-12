"use server"

import { getSessionUid } from "@/app/actions/_session"
import { createServerContainer } from "@/infraestructure/di/container"

type Result = { success: true } | { success: false; authRequired?: boolean; error: string }

/** Registrar este dispositivo para avisos push (exige haber activado y autorizado los avisos en el celular). */
export async function registerPushTokenAction(token: string): Promise<Result> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, authRequired: true, error: "Inicia sesión." }
  try { await createServerContainer().pushService.register(uid, String(token ?? "")); return { success: true } } catch (e) { return { success: false, error: e instanceof Error ? e.message : "No se pudo registrar." } }
}

/** Quitar este dispositivo. */
export async function unregisterPushTokenAction(token: string): Promise<Result> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, authRequired: true, error: "Inicia sesión." }
  await createServerContainer().pushService.unregister(uid, String(token ?? ""))
  return { success: true }
}
