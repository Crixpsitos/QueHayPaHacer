"use server"

import { getSessionUid } from "@/app/actions/_session"
import { isQhpaAdmin } from "@/app/lib/sites/qhpaAdmin"
import { createServerContainer } from "@/infraestructure/di/container"
import type { DepartureView, RequestView } from "@/application/services/activities/ActivityRequestService"

const validId = (id: unknown): id is string => typeof id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(id)

/** Salidas entre las que se puede elegir al reservar (pública: se pregunta antes de iniciar sesión). */
export async function getRequestOptionsAction(activityId: string): Promise<DepartureView[]> {
  if (!validId(activityId)) return []
  return createServerContainer().activityRequestService.options(activityId)
}

/** «Quiero reservar»: deja constancia (quién, qué salida, cuándo) para quien organiza. Silenciosa: sin sesión no hace nada. */
export async function requestActivityAction(activityId: string, date: string | null): Promise<{ recorded: boolean }> {
  const uid = await getSessionUid()
  if (!uid || !validId(activityId) || (date !== null && (typeof date !== "string" || date.length > 10))) return { recorded: false }
  try {
    const r = await createServerContainer().activityRequestService.request(uid, activityId, date)
    return { recorded: r.ok && r.created }
  } catch (e) {
    console.warn("[request-activity]", e instanceof Error ? e.message : "error")
    return { recorded: false }
  }
}

/** Solicitudes de reserva de mi actividad (solo su dueño o QHPA). null si no es suya. */
export async function listActivityRequestsAction(activityId: string): Promise<RequestView[] | null> {
  const uid = await getSessionUid()
  if (!uid || !validId(activityId)) return null
  return createServerContainer().activityRequestService.listForOwner({ uid, isAdmin: isQhpaAdmin(uid) }, activityId)
}
