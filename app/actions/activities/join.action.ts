"use server"

import { getSessionUid } from "@/app/actions/_session"
import { isQhpaAdmin } from "@/app/lib/sites/qhpaAdmin"
import { createServerContainer } from "@/infraestructure/di/container"
import type { JoinStatus } from "@/application/services/activities/ActivityJoinService"
import type { JoinRow } from "@/domain/repository/activities/IActivityJoinRepository"

type Result = { success: true } | { success: false; authRequired?: boolean; error: string }
const validId = (id: unknown): id is string => typeof id === "string" && id.length > 0 && id.length <= 128
const BAD = "Solicitud inválida."

/** Próximas salidas con cupos y si ya estoy dentro. Sin sesión también responde (sin "estás dentro"). */
export async function getJoinStatusAction(activityId: string): Promise<JoinStatus | null> {
  if (!validId(activityId)) return null
  return createServerContainer().activityJoinService.status(await getSessionUid(), activityId)
}

/** Unirme a una salida (`date` = día de la salida; vacío = la próxima). El uid sale solo de la sesión. */
export async function joinActivityAction(activityId: string, date: string | null): Promise<Result> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, authRequired: true, error: "Inicia sesión para unirte." }
  if (!validId(activityId) || (date !== null && (typeof date !== "string" || date.length > 10))) return { success: false, error: BAD }
  try {
    const r = await createServerContainer().activityJoinService.join(uid, activityId, date)
    return r.ok ? { success: true } : { success: false, error: r.error }
  } catch (e) {
    console.error("[joinActivity]", e instanceof Error ? e.message : "error")
    return { success: false, error: "No se pudo completar la inscripción. Intenta de nuevo." }
  }
}

/** Cancelar mi inscripción (solo la mía: la clave incluye mi uid de sesión). */
export async function cancelJoinAction(activityId: string, key: string): Promise<Result> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, authRequired: true, error: "Inicia sesión." }
  if (!validId(activityId) || !validId(key)) return { success: false, error: BAD }
  try {
    const r = await createServerContainer().activityJoinService.cancel(uid, activityId, key)
    return r.ok ? { success: true } : { success: false, error: r.error }
  } catch (e) {
    console.error("[cancelJoin]", e instanceof Error ? e.message : "error")
    return { success: false, error: "No se pudo cancelar. Intenta de nuevo." }
  }
}

/** Lista de inscritos: solo el dueño de la actividad o QHPA. */
export async function listJoinsAction(activityId: string): Promise<{ success: true; rows: JoinRow[] } | { success: false; error: string }> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, error: "Inicia sesión." }
  if (!validId(activityId)) return { success: false, error: BAD }
  const rows = await createServerContainer().activityJoinService.listForManager({ uid, isAdmin: isQhpaAdmin(uid) }, activityId)
  return rows ? { success: true, rows } : { success: false, error: "No encontramos esa actividad." }
}

/** Cerrar o reabrir inscripciones (dueño o QHPA). */
export async function setJoinClosedAction(activityId: string, closed: boolean): Promise<Result> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, authRequired: true, error: "Inicia sesión." }
  if (!validId(activityId) || typeof closed !== "boolean") return { success: false, error: BAD }
  try {
    const r = await createServerContainer().activityJoinService.setClosed({ uid, isAdmin: isQhpaAdmin(uid) }, activityId, closed)
    return r.ok ? { success: true } : { success: false, error: r.error }
  } catch (e) {
    console.error("[setJoinClosed]", e instanceof Error ? e.message : "error")
    return { success: false, error: "No se pudo cambiar. Intenta de nuevo." }
  }
}
