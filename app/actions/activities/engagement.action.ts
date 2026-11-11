"use server"

import { getSessionUid } from "@/app/actions/_session"
import { createServerContainer } from "@/infraestructure/di/container"

type Result = { success: true } | { success: false; authRequired?: boolean; error: string }
const validId = (id: unknown): id is string => typeof id === "string" && id.length > 0 && id.length <= 128

/** Lo mío en esta actividad (guardada / "Yo fui"). Sin sesión: nada. El uid sale solo de la cookie. */
export async function getMyActivityEngagementAction(activityId: string): Promise<{ loggedIn: boolean; saved: boolean; visited: boolean }> {
  const uid = await getSessionUid()
  if (!uid || !validId(activityId)) return { loggedIn: false, saved: false, visited: false }
  const { activityEngagementService: s } = createServerContainer()
  const [saved, visited] = await Promise.all([s.savedAmong(uid, [activityId]), s.hasVisited(uid, activityId)])
  return { loggedIn: true, saved: saved.length > 0, visited }
}

/** Guardar o quitar de guardados (privado). */
export async function setActivitySavedAction(activityId: string, saved: boolean): Promise<Result> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, authRequired: true, error: "Inicia sesión para guardar." }
  if (!validId(activityId)) return { success: false, error: "Actividad inválida." }
  try {
    await createServerContainer().activityEngagementService.setSaved(uid, activityId, saved === true)
    return { success: true }
  } catch (e) {
    console.error("[setActivitySaved]", e instanceof Error ? e.message : "error")
    return { success: false, error: "No se pudo guardar. Intenta de nuevo." }
  }
}

/** "Yo fui": una vez por persona. */
export async function markActivityVisitedAction(activityId: string): Promise<Result> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, authRequired: true, error: "Inicia sesión para marcar que fuiste." }
  if (!validId(activityId)) return { success: false, error: "Actividad inválida." }
  try {
    await createServerContainer().activityEngagementService.markVisited(uid, activityId)
    return { success: true }
  } catch (e) {
    console.error("[markActivityVisited]", e instanceof Error ? e.message : "error")
    return { success: false, error: "No se pudo registrar. Intenta de nuevo." }
  }
}
