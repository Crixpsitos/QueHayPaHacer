"use server"

import { getSessionUid } from "@/app/actions/_session"
import { createServerContainer } from "@/infraestructure/di/container"
import { STAMPS_FOR_BADGE } from "@/domain/entities/activities/passport"

type Result<T = object> = ({ success: true } & T) | { success: false; authRequired?: boolean; error: string }
const validId = (id: unknown): id is string => typeof id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(id)

/** QR de sello de MI actividad: devuelve la ruta que se imprime (solo quien la gestiona). */
export async function getStampQrAction(activityId: string): Promise<Result<{ path: string }>> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, authRequired: true, error: "Inicia sesión." }
  if (!validId(activityId)) return { success: false, error: "Actividad inválida." }
  try {
    const token = await createServerContainer().activityStampService.qrToken(uid, activityId)
    return { success: true, path: `/sello/${activityId}/${token}` }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "No se pudo generar el QR." }
  }
}

/** Sellar mi pasaporte al escanear el QR del local. La identidad sale de la cookie; el código lo valida el servidor. */
export async function collectStampAction(activityId: string, token: string): Promise<Result<{ total: number }>> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, authRequired: true, error: "Inicia sesión para sellar tu pasaporte." }
  if (!validId(activityId) || typeof token !== "string" || token.length > 64) return { success: false, error: "Ese código de sello no es válido." }
  try {
    const r = await createServerContainer().activityStampService.collect(uid, activityId, token)
    return { success: true, total: r.total }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "No se pudo sellar." }
  }
}

export interface PassportView { stamps: { title: string; slug: string; date: string }[]; goal: number }

/** Mi pasaporte: los sellos conseguidos (privado). */
export async function getMyPassportAction(): Promise<PassportView | null> {
  const uid = await getSessionUid()
  if (!uid) return null
  const c = createServerContainer()
  const mine = await c.activityStampService.listMine(uid, 100)
  const out: PassportView["stamps"] = []
  for (const s of mine) {
    const a = await c.activityService.getPublicById(s.activityId)
    if (a) out.push({ title: a.title, slug: a.slug, date: new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" }).format(s.at) })
  }
  return { stamps: out, goal: STAMPS_FOR_BADGE }
}
