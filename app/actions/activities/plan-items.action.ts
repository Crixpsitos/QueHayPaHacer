"use server"

import { getSessionUid } from "@/app/actions/_session"
import { createServerContainer } from "@/infraestructure/di/container"
import type { PlanItem, PlanItemSlot } from "@/domain/entities/activities/planItem"

type Result = { success: true; item: PlanItem } | { success: false; error: string; authRequired?: boolean }

/** «Agregar a mi plan» un evento (entra con su día y hora) o un sitio (con el día y la hora que elijas, o sin día). Con sesión. */
export async function addToPlanAction(kind: string, id: string, slot?: PlanItemSlot | null): Promise<Result> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, authRequired: true, error: "Inicia sesión para armar tu plan." }
  try {
    const r = await createServerContainer().planExtrasService.add(uid, kind, id, slot ?? null)
    return r.ok ? { success: true, item: r.item } : { success: false, error: r.error }
  } catch (e) {
    console.error("[addToPlan]", e instanceof Error ? e.message : "error")
    return { success: false, error: "No se pudo agregar. Intenta de nuevo." }
  }
}

export async function removeFromPlanAction(kind: string, id: string): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, error: "Inicia sesión." }
  try {
    return { success: await createServerContainer().planExtrasService.remove(uid, kind, id) }
  } catch {
    return { success: false, error: "No se pudo quitar. Intenta de nuevo." }
  }
}

/** ¿Este evento o sitio ya está en mi plan? null si no, o si no hay sesión. */
export async function getPlanItemAction(kind: string, id: string): Promise<PlanItem | null> {
  const uid = await getSessionUid()
  if (!uid) return null
  return createServerContainer().planExtrasService.state(uid, kind, id).catch(() => null)
}
