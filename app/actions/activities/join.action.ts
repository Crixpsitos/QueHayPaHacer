"use server"

import { getSessionUid } from "@/app/actions/_session"
import { isQhpaAdmin } from "@/app/lib/sites/qhpaAdmin"
import { createServerContainer } from "@/infraestructure/di/container"
import type { JoinStatus, ManagerView } from "@/application/services/activities/ActivityJoinService"
import type { JoinRow } from "@/domain/repository/activities/IActivityJoinRepository"

type Result = { success: true } | { success: false; authRequired?: boolean; error: string }
const validId = (id: unknown): id is string => typeof id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(id)
const BAD = "Solicitud inválida."

/** Próximas salidas con cupos y si ya estoy dentro. Sin sesión también responde (sin "estás dentro"). */
export async function getJoinStatusAction(activityId: string): Promise<JoinStatus | null> {
  if (!validId(activityId)) return null
  return createServerContainer().activityJoinService.status(await getSessionUid(), activityId)
}

/** Unirme a una salida (`date` = día de la salida; vacío = la próxima). El uid sale solo de la sesión. */
export async function joinActivityAction(activityId: string, date: string | null, contact?: { phone?: string; consent?: boolean }, extras?: { label: string; qty: number }[]): Promise<Result> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, authRequired: true, error: "Inicia sesión para unirte." }
  if (!validId(activityId) || (date !== null && (typeof date !== "string" || date.length > 10))) return { success: false, error: BAD }
  try {
    const safe = { phone: typeof contact?.phone === "string" ? contact.phone.slice(0, 30) : undefined, consent: contact?.consent === true }
    const r = await createServerContainer().activityJoinService.join(uid, activityId, date, safe, Array.isArray(extras) ? extras.slice(0, 20) : [])
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

/** Confirmar pago, "No pagó" o deshacer (dueño o QHPA). */
export async function setJoinStatusAction(activityId: string, key: string, personUid: string, to: "pending" | "confirmed" | "noShow"): Promise<Result> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, authRequired: true, error: "Inicia sesión." }
  if (!validId(activityId) || !validId(key) || !validId(personUid)) return { success: false, error: BAD }
  try {
    const r = await createServerContainer().activityJoinService.setStatus({ uid, isAdmin: isQhpaAdmin(uid) }, activityId, key, personUid, to)
    return r.ok ? { success: true } : { success: false, error: r.error }
  } catch (e) {
    console.error("[setJoinStatus]", e instanceof Error ? e.message : "error")
    return { success: false, error: "No se pudo cambiar. Intenta de nuevo." }
  }
}

/** Datos de la pantalla "Reservas" (dueño o QHPA). null = no existe o no es tuya. */
export async function getReservationsAction(activityId: string): Promise<ManagerView | null> {
  const uid = await getSessionUid()
  if (!uid || !validId(activityId)) return null
  return createServerContainer().activityJoinService.managerView({ uid, isAdmin: isQhpaAdmin(uid) }, activityId)
}

const reply = (r: { ok: true } | { ok: false; error: string }): Result => (r.ok ? { success: true } : { success: false, error: r.error })

/** Anotar a mano a una persona sin cuenta en una salida (dueño o QHPA). */
export async function addReservationAction(activityId: string, p: { name: string; phone?: string; date: string | null; extras?: { label: string; qty: number }[] }): Promise<Result> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, authRequired: true, error: "Inicia sesión." }
  if (!validId(activityId) || typeof p?.name !== "string" || (p.date !== null && (typeof p.date !== "string" || p.date.length > 10))) return { success: false, error: BAD }
  try {
    return reply(await createServerContainer().activityJoinService.addManual({ uid, isAdmin: isQhpaAdmin(uid) }, activityId, { name: p.name.slice(0, 120), phone: typeof p.phone === "string" ? p.phone.slice(0, 30) : undefined, date: p.date, extras: Array.isArray(p.extras) ? p.extras.slice(0, 20) : [] }))
  } catch (e) {
    console.error("[addReservation]", e instanceof Error ? e.message : "error")
    return { success: false, error: "No se pudo anotar. Intenta de nuevo." }
  }
}

/** Ajustar los servicios aparte de una reserva (dueño o QHPA). */
export async function setReservationExtrasAction(activityId: string, key: string, personUid: string, extras: { label: string; qty: number }[]): Promise<Result> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, authRequired: true, error: "Inicia sesión." }
  if (!validId(activityId) || !validId(key) || !validId(personUid)) return { success: false, error: BAD }
  try {
    return reply(await createServerContainer().activityJoinService.setExtras({ uid, isAdmin: isQhpaAdmin(uid) }, activityId, key, personUid, Array.isArray(extras) ? extras.slice(0, 20) : []))
  } catch (e) {
    console.error("[setReservationExtras]", e instanceof Error ? e.message : "error")
    return { success: false, error: "No se pudo guardar. Intenta de nuevo." }
  }
}

/** De interesado (solicitud) a reservado en esa salida (dueño o QHPA). */
export async function promoteRequestAction(activityId: string, key: string, personUid: string): Promise<Result> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, authRequired: true, error: "Inicia sesión." }
  if (!validId(activityId) || !validId(key) || !validId(personUid)) return { success: false, error: BAD }
  try {
    return reply(await createServerContainer().activityRequestService.promote({ uid, isAdmin: isQhpaAdmin(uid) }, activityId, key, personUid))
  } catch (e) {
    console.error("[promoteRequest]", e instanceof Error ? e.message : "error")
    return { success: false, error: "No se pudo reservar. Intenta de nuevo." }
  }
}
