"use server"

import { updateTag } from "next/cache"
import { getAdminUid } from "@/app/actions/_admin"
import { createServerContainer } from "@/infraestructure/di/container"
import { parseTransitRoutes } from "@/application/services/config/TransitRouteService"
import type { TransitRoute } from "@/domain/entities/sites/value-objects/SiteTransit"
import { TRANSIT_TAG } from "./_tags"

// Acciones del panel de administración del catálogo de rutas. Cada una verifica en el servidor que la sesión sea de un admin.
type Result<T = object> = ({ success: true } & T) | { success: false; error: string }
const NOT_ALLOWED = { success: false, error: "No autorizado." } as const

export async function getTransitRoutesAdminAction(): Promise<Result<{ routes: TransitRoute[] }>> {
  if (!(await getAdminUid())) return NOT_ALLOWED
  return { success: true, routes: await createServerContainer().transitRouteService.list() }
}

/** Reemplaza el catálogo completo e invalida la caché (también la de los estados "por confirmar" de los sitios). */
export async function saveTransitRoutesAction(routes: TransitRoute[]): Promise<Result> {
  const uid = await getAdminUid()
  if (!uid) return NOT_ALLOWED
  const parsed = parseTransitRoutes(routes)
  if (!parsed.ok) return { success: false, error: parsed.error }
  await createServerContainer().transitRouteService.save(parsed.routes, uid)
  updateTag(TRANSIT_TAG)
  return { success: true }
}

/** "Esta ruta cambió": los sitios que la usan y se confirmaron antes quedan "por confirmar" hasta que su dueño reconfirme. */
export async function markRouteChangedAction(id: string): Promise<Result> {
  const uid = await getAdminUid()
  if (!uid) return NOT_ALLOWED
  if (typeof id !== "string") return { success: false, error: "Ruta inválida." }
  const found = await createServerContainer().transitRouteService.markChanged(id, uid)
  if (!found) return { success: false, error: "No existe esa ruta en el catálogo." }
  updateTag(TRANSIT_TAG)
  return { success: true }
}

export async function refreshTransitCacheAction(): Promise<Result> {
  if (!(await getAdminUid())) return NOT_ALLOWED
  updateTag(TRANSIT_TAG)
  return { success: true }
}
