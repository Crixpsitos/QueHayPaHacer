"use server"

import { getSessionUid } from "@/app/actions/_session"
import { createServerContainer } from "@/infraestructure/di/container"
import { LEGAL_VERSION } from "@/app/lib/legal/version"
import type { ComplaintView } from "@/domain/entities/activities/HostIdentity"

type Result = { success: true } | { success: false; error: string }

/**
 * Guarda o reconfirma los datos de identificación del oferente (Ley 1480 art. 53).
 * El uid sale SOLO de la sesión; cualquier uid dentro de `raw` se ignora.
 */
export async function saveHostIdentityAction(raw: unknown, dataAuthorization: boolean): Promise<Result> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, error: "Inicia sesión para continuar." }
  try {
    const r = await createServerContainer().hostIdentityService.save(uid, raw, dataAuthorization, LEGAL_VERSION)
    return r.ok ? { success: true } : { success: false, error: r.error }
  } catch (e) {
    console.error("[saveHostIdentity]", e instanceof Error ? e.message : "error")
    return { success: false, error: "No se pudieron guardar tus datos. Intenta nuevamente." }
  }
}

/**
 * Quien necesita presentar una queja consulta los datos de quien ofrece la actividad.
 * El oferente se deduce de la actividad en el servidor (no se acepta un uid del cliente).
 */
export async function getHostIdentityForComplaintAction(activityId: string): Promise<{ success: true; data: ComplaintView } | { success: false; error: string }> {
  const requesterUid = await getSessionUid()
  if (!requesterUid) return { success: false, error: "Inicia sesión para consultar los datos de quien ofrece." }
  if (typeof activityId !== "string" || !activityId || activityId.length > 128) return { success: false, error: "Actividad inválida." }
  try {
    const { activityService, hostIdentityService } = createServerContainer()
    const activity = await activityService.getPublicById(activityId)
    if (!activity) return { success: false, error: "No encontramos esta actividad." }
    const r = await hostIdentityService.consultForComplaint({ requesterUid, hostUid: activity.ownerUid, activityId })
    return r.ok ? { success: true, data: r.data } : { success: false, error: r.error }
  } catch (e) {
    console.error("[getHostIdentityForComplaint]", e instanceof Error ? e.message : "error")
    return { success: false, error: "No se pudo consultar. Intenta nuevamente." }
  }
}
