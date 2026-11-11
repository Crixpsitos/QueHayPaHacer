"use server"

import { getSessionUid } from "@/app/actions/_session"
import { isQhpaAdmin } from "@/app/lib/sites/qhpaAdmin"
import { createServerContainer } from "@/infraestructure/di/container"
import { revalidateActivity } from "./_revalidate"

/** Pausa o reactiva una actividad propia (QHPA puede con cualquiera). Pausada = fuera de listados, conserva URL y reseñas. */
export async function setActivityActiveAction(activityId: string, active: boolean): Promise<{ success: true } | { success: false; error: string }> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, error: "Inicia sesión para continuar." }
  if (typeof activityId !== "string" || !activityId || activityId.length > 128 || typeof active !== "boolean") return { success: false, error: "Solicitud inválida." }
  try {
    const { activityPublishService } = createServerContainer()
    const r = await activityPublishService.setActive({ uid, isAdmin: isQhpaAdmin(uid) }, activityId, active)
    if (!r.ok) return { success: false, error: r.error }
    revalidateActivity(uid, activityId)
    return { success: true }
  } catch (e) {
    console.error("[setActivityActive]", e instanceof Error ? e.message : "error")
    return { success: false, error: "No se pudo cambiar la visibilidad." }
  }
}
