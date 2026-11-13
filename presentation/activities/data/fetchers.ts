import { cache } from "react"
import { cacheLife, cacheTag } from "next/cache"
import { createServerContainer } from "@/infraestructure/di/container"
import type { ActivityFilters } from "@/domain/entities/activities/filters"
import { bogotaDateIso, nextOccurrence } from "@/domain/entities/activities/value-objects/occurrences"
import { pickFeatured } from "@/domain/entities/activities/featured"
import { anytimeIds, buildAgenda } from "@/domain/entities/activities/agenda"
import { countsByDay, dayRange, whenRange } from "@/domain/entities/activities/when"
import { moreToDo, type LevelKey, type MoreItem } from "@/domain/entities/activities/moreToDo"
import { chooseHomeBlock } from "@/presentation/activities/lib/homeBlock"
import { toCardView, toPublicView, type ActivityCardView, type ActivityPublicView } from "@/presentation/activities/lib/publicView"

type CardSource = Parameters<typeof toCardView>[0]

/** Tarjetas con el dueño de su sitio (una lectura por sitio). */
async function cardsOf(list: CardSource[]): Promise<ActivityCardView[]> {
  const sitesSvc = createServerContainer().sitesService
  const ids = [...new Set(list.map((a) => a.siteId).filter((x): x is string => !!x))]
  const owners = new Map(await Promise.all(ids.map(async (id) => [id, (await sitesSvc.getActivityLinkSnapshot(id))?.owner ?? null] as const)))
  return list.map((a) => ({ ...toCardView(a), owner: a.siteId ? (owners.get(a.siteId) ?? null) : null }))
}

/** Actividades elegidas por alguna promoción vigente de la carta de su sitio (filtro «Promos hoy»). Caché corta; el panel de carta la invalida. */
export const fetchPromoActivityIds = async (): Promise<string[]> => {
  "use cache"
  cacheLife("hub")
  cacheTag("promo-activity-ids", "activity-list")
  return createServerContainer().siteCatalogService.promoActivityIds()
}

/** Si el filtro pide promociones, le agrega los ids que las tienen (la carta vive aparte de las actividades). */
async function withPromoIds(filters: ActivityFilters): Promise<ActivityFilters> {
  return filters.promo ? { ...filters, promoActivityIds: await fetchPromoActivityIds() } : filters
}

export interface ActivityPageData extends ActivityPublicView {
  /** Sitio vinculado (nombre y slug para el enlace), o null en actividades globales. */
  site: { name: string; slug: string; address: string; geo: { latitude: number; longitude: number } | null; owner: { displayName: string; photoURL: string } | null } | null
}

async function withSite(view: ActivityPublicView): Promise<ActivityPageData> {
  if (!view.siteId) return { ...view, site: null }
  const s = await createServerContainer().sitesService.getActivityLinkSnapshot(view.siteId)
  return { ...view, site: s ? { name: s.name, slug: s.slug, address: s.address, geo: s.geo, owner: s.owner } : null }
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
  cacheLife("hub")
  cacheTag("activity-list")
  const r = await createServerContainer().activityService.search(await withPromoIds(filters), offset, pageSize)
  return { items: await cardsOf(r.items), total: r.total, nextOffset: r.nextOffset }
}

/** `sitio=<slug>` → id del sitio (null si no existe: el hub muestra vacío en vez de ignorar el filtro). */
export const resolveSiteId = cache(async (slug: string): Promise<string | null> => {
  const site = await createServerContainer().sitesService.getSiteDetailBySlug(slug)
  return site?.id ?? null
})

export const SITE_BLOCK_MAX = 6

/** Actividades públicas de un sitio para su ficha (máx. 6). Se invalida con `site-<id>-activities` o `activity-list`. */
export const fetchSiteActivities = async (siteId: string): Promise<ActivityCardView[]> => {
  "use cache"
  cacheLife("hub")
  cacheTag(`site-${siteId}-activities`, "activity-list")
  const list = await createServerContainer().activityService.listForSite(siteId)
  return cardsOf(list.slice(0, SITE_BLOCK_MAX))
}

export interface HomeBlockData {
  mode: "today" | "week"
  /** "miércoles 11 de noviembre", ya formateado (la caché es de horas: no depende de la hora del lector). */
  dateLabel: string
  items: ActivityCardView[]
}

/** Bloque "Actividades de hoy" de la portada. Caché de horas; se invalida con `activity-list`. null = no dibujar. */
export const fetchHomeActivities = async (): Promise<HomeBlockData | null> => {
  "use cache"
  cacheLife("hours")
  cacheTag("activity-list")
  const svc = createServerContainer().activityService
  const now = new Date()
  const [today, week] = await Promise.all([svc.search({ when: "hoy" }, 0, 100), svc.search({ when: "esta-semana" }, 0, 100)])
  const key = (a: { id: string; ownerUid: string }) => ({ id: a.id, host: a.ownerUid })
  const r = chooseHomeBlock(today.items.map(key), week.items.map(key), bogotaDateIso(now))
  if (!r.ids.length) return null
  const pool = new Map([...week.items, ...today.items].map((a) => [a.id, a]))
  const dateLabel = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Bogota" }).format(now)
  return { mode: r.mode, dateLabel, items: await cardsOf(r.ids.map((id) => pool.get(id)!)) }
}

export interface RelatedData { sameSite: ActivityCardView[]; similar: ActivityCardView[]; similarTitle: string }

/** Cierre de la ficha: más actividades del mismo sitio y parecidas (misma categoría; si no hay, lo de esta semana). */
export const fetchRelatedActivities = async (id: string, categorySlug: string, siteId: string | null): Promise<RelatedData> => {
  "use cache"
  cacheLife("hub")
  cacheTag("activity-list")
  const svc = createServerContainer().activityService
  const sameSite = siteId ? (await svc.listForSite(siteId)).filter((a) => a.id !== id).slice(0, 6) : []
  const taken = new Set([id, ...sameSite.map((a) => a.id)])
  let similar = (await svc.search({ category: categorySlug as ActivityFilters["category"] }, 0, 12)).items.filter((a) => !taken.has(a.id)).slice(0, 6)
  let similarTitle = "Parecidas"
  if (similar.length < 2) {
    similar = (await svc.search({ when: "esta-semana" }, 0, 12)).items.filter((a) => !taken.has(a.id)).slice(0, 6)
    similarTitle = "También esta semana"
  }
  return { sameSite: await cardsOf(sameSite), similar: await cardsOf(similar), similarTitle }
}

export interface HubMeta { days: { date: string; count: number }[]; categories: Record<string, number>; total: number }

/** Lo que necesita la cabecera del hub: cuántas actividades salen cada día de la semana y por categoría. */
export const fetchHubMeta = async (): Promise<HubMeta> => {
  "use cache"
  cacheLife("hub")
  cacheTag("activity-list")
  const all = await createServerContainer().activityService.listPublic(500)
  const categories: Record<string, number> = {}
  for (const a of all) categories[a.category] = (categories[a.category] ?? 0) + 1
  return { days: countsByDay(all.map((a) => a.schedule), new Date(), 7), categories, total: all.length }
}

/** «El plan de la semana» del hub: una actividad, la misma todo el día (ver `pickFeatured`). null si no hay. */
export const fetchFeaturedPlan = async (): Promise<ActivityCardView | null> => {
  "use cache"
  cacheLife("hours")
  cacheTag("activity-list")
  const all = await createServerContainer().activityService.listPublic(500)
  const now = new Date()
  const id = pickFeatured(all.map((a) => ({ id: a.id, host: a.ownerUid, hasPhoto: a.media.some((m) => m.type === "image" && m.isCover && m.status !== "error"), nextAt: nextOccurrence(a.schedule, now)?.startsAt?.getTime() ?? null })), now, bogotaDateIso(now))
  const pick = all.find((a) => a.id === id)
  return pick ? (await cardsOf([pick]))[0] : null
}

export interface AgendaDayView { date: string; /** Grupo «sin hora fija» de un rango de varios días (no es un día). */ anytime?: boolean; entries: { card: ActivityCardView; hhmm: string | null }[] }

/** Agenda por día para un «cuándo» o un día suelto (con los demás filtros aplicados). */
export const fetchAgenda = async (filters: ActivityFilters): Promise<AgendaDayView[]> => {
  "use cache"
  cacheLife("hub")
  cacheTag("activity-list")
  const range = filters.day ? dayRange(filters.day) : filters.when ? whenRange(filters.when, new Date()) : null
  if (!range) return []
  const svc = createServerContainer().activityService
  const { items } = await svc.search(await withPromoIds(filters), 0, 200)
  const byId = new Map(items.map((a) => [a.id, a]))
  const input = items.map((a) => ({ id: a.id, schedule: a.schedule }))
  const cards = new Map((await cardsOf(items)).map((c) => [c.id, c]))
  const days: AgendaDayView[] = buildAgenda(input, range, new Date()).map((d) => ({ date: d.date, entries: d.entries.map((e) => ({ card: cards.get(e.id)!, hhmm: e.hhmm })) }))
  const anytime = anytimeIds(input, range, new Date())
  if (anytime.length) days.push({ date: "", anytime: true, entries: anytime.map((id) => ({ card: cards.get(id)!, hhmm: null })) })
  return days
}

export interface MoreRow extends ActivityCardView { meters: number | null }
export interface MoreLevelView { key: LevelKey; total: number; rows: MoreRow[] }

/**
 * «Más para hacer» de la ficha: aquí mismo / del grupo → cerca / parecidas → hoy en Ibagué.
 * La distancia sale de las coordenadas de la actividad (punto de encuentro o sitio): no depende de quien mira, por eso se cachea.
 */
export const fetchMoreToDo = async (id: string): Promise<MoreLevelView[]> => {
  "use cache"
  cacheLife("hub")
  cacheTag("activity-list", `activity-${id}`)
  const c = createServerContainer()
  const [current, pool] = await Promise.all([c.activityService.getPublicById(id), c.activityService.listPublic(60)])
  if (!current) return []
  const sites = new Map<string, Awaited<ReturnType<typeof c.sitesService.getActivityLinkSnapshot>>>()
  for (const siteId of new Set([current, ...pool].map((a) => a.siteId).filter((x): x is string => !!x))) sites.set(siteId, await c.sitesService.getActivityLinkSnapshot(siteId))
  const item = (a: (typeof pool)[number]): MoreItem => ({
    id: a.id, siteId: a.siteId, hostId: a.host.id, category: a.category,
    geo: a.meetingPoint.geo ? { latitude: a.meetingPoint.geo.lat, longitude: a.meetingPoint.geo.lng } : ((a.siteId && sites.get(a.siteId)?.geo) || null),
  })
  const byId = new Map(pool.map((a) => [a.id, a]))
  return moreToDo(item(current), pool.map(item)).map((l) => ({ key: l.key, total: l.total, rows: l.items.map((i) => { const a = byId.get(i.id)!; return { ...toCardView(a), owner: (a.siteId && sites.get(a.siteId)?.owner) || null, meters: i.meters } }) }))
}

export interface MapPin { id: string; slug: string; title: string; categorySlug: string; categoryName: string; priceFrom: string; lat: number; lng: number; hhmm: string | null; durationMinutes: number | null; placeName: string }
export interface HubMapData { date: string; pins: MapPin[]; withoutPlace: number; hours: (string | null)[] }

/** Mapa del hub: las actividades de UN día con coordenadas (punto de encuentro fijo o sitio). Las demás se cuentan aparte. */
export const fetchHubMap = async (day: string, filters: ActivityFilters): Promise<HubMapData> => {
  "use cache"
  cacheLife("hub")
  cacheTag("activity-list")
  const c = createServerContainer()
  const { items } = await c.activityService.search(await withPromoIds({ ...filters, when: undefined, day }), 0, 200)
  const hhmmOf = new Map(buildAgenda(items.map((a) => ({ id: a.id, schedule: a.schedule })), dayRange(day), new Date()).flatMap((d) => d.entries.map((e) => [e.id, e.hhmm] as const)))
  const sites = new Map<string, Awaited<ReturnType<typeof c.sitesService.getActivityLinkSnapshot>>>()
  for (const siteId of new Set(items.map((a) => a.siteId).filter((x): x is string => !!x))) sites.set(siteId, await c.sitesService.getActivityLinkSnapshot(siteId))
  const pins: MapPin[] = []
  let withoutPlace = 0
  for (const a of items) {
    const site = a.siteId ? sites.get(a.siteId) : null
    const g = a.meetingPoint.mode === "fixed" && a.meetingPoint.geo ? { latitude: a.meetingPoint.geo.lat, longitude: a.meetingPoint.geo.lng } : site?.geo
    if (!g) { withoutPlace++; continue }
    const v = toCardView(a)
    pins.push({ id: a.id, slug: a.slug, title: a.title, categorySlug: a.category, categoryName: v.categoryName, priceFrom: v.priceFrom, lat: g.latitude, lng: g.longitude, hhmm: hhmmOf.get(a.id) ?? null, durationMinutes: a.durationMinutes, placeName: site?.name ?? a.meetingPoint.text })
  }
  return { date: day, pins, withoutPlace, hours: [...hhmmOf.values()] }
}
