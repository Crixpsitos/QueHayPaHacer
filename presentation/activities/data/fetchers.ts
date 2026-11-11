import { cacheLife, cacheTag } from "next/cache"
import { createServerContainer } from "@/infraestructure/di/container"
import type { ActivityFilters } from "@/domain/entities/activities/filters"
import { toCardView, toPublicView, type ActivityCardView, type ActivityPublicView } from "@/presentation/activities/lib/publicView"

export interface ActivityPageData extends ActivityPublicView {
  /** Sitio vinculado (nombre y slug para el enlace), o null en actividades globales. */
  site: { name: string; slug: string } | null
}

async function withSite(view: ActivityPublicView): Promise<ActivityPageData> {
  if (!view.siteId) return { ...view, site: null }
  const s = await createServerContainer().sitesService.getActivityLinkSnapshot(view.siteId)
  return { ...view, site: s ? { name: s.name, slug: s.slug } : null }
}

/**
 * Ficha PÚBLICA por slug: null si no existe o no es visible (pendiente, rechazada, pausada, sitio despublicado).
 * Compartida por metadata y página (una sola lectura por render). Las acciones invalidan `activity-<id>` y `activity-list`.
 */
export const fetchPublicActivity = async (slug: string): Promise<ActivityPageData | null> => {
  "use cache"
  cacheTag("activity-list", `activity-slug-${slug}`)
  const a = await createServerContainer().activityService.getPublicBySlug(slug)
  if (!a) {
    // Puede aprobarse pronto (el script de QHPA no invalida tags): caché corta para que aparezca en ~1 min.
    cacheLife("minutes")
    return null
  }
  cacheTag(`activity-${a.id}`)
  cacheLife("hours")
  return withSite(toPublicView(a))
}

/** Vista previa para el dueño o QHPA (lectura sin caché, depende de la sesión). null si no tiene permiso. */
export async function fetchActivityPreview(slug: string, viewer: { uid: string | null; isAdmin: boolean }) {
  const a = await createServerContainer().activityService.getForViewer(slug, viewer)
  if (!a) return null
  return { data: await withSite(toPublicView(a)), publicationStatus: a.publicationStatus, moderationStatus: a.moderationStatus, isActive: a.isActive }
}


export const HUB_PAGE_SIZE = 12

export interface ActivityPage {
  items: ActivityCardView[]
  total: number
  nextOffset: number | null
}

/**
 * Página del hub. Caché corta: las aprobaciones por script no invalidan tags; las acciones de la app sí (`activity-list`).
 * `siteId` ya viene resuelto (los parámetros primitivos son la clave de caché).
 */
export const fetchActivityPage = async (filters: ActivityFilters, offset: number, pageSize: number = HUB_PAGE_SIZE): Promise<ActivityPage> => {
  "use cache"
  cacheLife("minutes")
  cacheTag("activity-list")
  const r = await createServerContainer().activityService.search(filters, offset, pageSize)
  return { items: r.items.map(toCardView), total: r.total, nextOffset: r.nextOffset }
}

/** `sitio=<slug>` → id del sitio (null si no existe: el hub muestra vacío en vez de ignorar el filtro). */
export async function resolveSiteId(slug: string): Promise<string | null> {
  const site = await createServerContainer().sitesService.getSiteDetailBySlug(slug)
  return site?.id ?? null
}

export const SITE_BLOCK_MAX = 6

/** Actividades públicas de un sitio para su ficha (máx. 6). Se invalida con `site-<id>-activities` o `activity-list`. */
export const fetchSiteActivities = async (siteId: string): Promise<ActivityCardView[]> => {
  "use cache"
  cacheLife("minutes")
  cacheTag(`site-${siteId}-activities`, "activity-list")
  const list = await createServerContainer().activityService.listForSite(siteId)
  return list.slice(0, SITE_BLOCK_MAX).map(toCardView)
}
