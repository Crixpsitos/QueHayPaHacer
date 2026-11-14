import { cacheLife, cacheTag } from "next/cache"
import { createServerContainer } from "@/infraestructure/di/container"
import type { Events } from "@/domain/entities/events/Events"
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel"
import { buildAgenda } from "@/domain/entities/activities/agenda"
import { MOMENT_KEYS, momentRanges } from "@/domain/entities/home/moments"
import { toCardView } from "@/presentation/activities/lib/publicView"
import { formatPrice } from "@/presentation/events/components/detail/format"
import { getSiteOpenStatus } from "@/presentation/sites/lib/openStatus"
import { siteCategoryLabel } from "@/presentation/sites/lib/constants"
import { buildHomeView, clockText, type ActivityIn, type EscapadaIn, type EventIn, type HomeView, type SiteIn } from "../lib/buildHomeView"

const PAGE = 30
const MAX_PAGES = 4 // ponytail: tope de 120 eventos próximos en el Home; si la cartelera crece, sube MAX_PAGES

export const fetchEvent = async (id: string): Promise<Events | null> => {
  "use cache"
  cacheLife("weeks")
  cacheTag(`event-${id}`)
  return createServerContainer().eventsService.getEventById(id)
}

export const fetchSite = async (id: string): Promise<SiteDetail | null> => {
  "use cache"
  cacheLife("weeks")
  cacheTag(`site-${id}`)
  return createServerContainer().sitesService.getSiteDetailById(id)
}

/** Eventos publicados de la cartelera (hasta MAX_PAGES páginas), con su detalle cacheado. Lo comparten la portada y /eventos. */
export async function loadPublishedEvents(): Promise<Events[]> {
  const svc = createServerContainer().eventsService
  const ids: string[] = []
  let cursor: string | null = null
  for (let i = 0; i < MAX_PAGES; i++) {
    const page: { ids: string[]; nextCursor: string | null } = await svc.getAllEventsPaginated(PAGE, cursor)
    ids.push(...page.ids)
    cursor = page.nextCursor
    if (!cursor) break
  }
  return (await Promise.all(ids.map(fetchEvent))).filter((e): e is Events => !!e && e.status === "published")
}

async function loadEvents(): Promise<EventIn[]> {
  const list = await loadPublishedEvents()
  return list.map((e) => ({
    id: e.id,
    slug: e.slug,
    title: e.title,
    startsAt: e.startDate.getTime(),
    endsAt: e.endDate.getTime(),
    venue: e.location?.venue ?? "",
    price: formatPrice(e.price),
    coverUrl: e.mainImage?.status === "error" ? null : (e.mainImage?.url ?? null),
    siteId: e.location?.siteId ?? null,
  }))
}

async function loadActivities(now: Date): Promise<ActivityIn[]> {
  const all = await createServerContainer().activityService.listPublic(500)
  const ranges = momentRanges(now)
  const input = all.map((a) => ({ id: a.id, schedule: a.schedule }))
  // primera salida de cada actividad en cada momento (la agenda ya viene ordenada por día y hora)
  const first: Record<string, ActivityIn["occ"]> = {}
  for (const key of MOMENT_KEYS) {
    for (const day of buildAgenda(input, ranges[key], now)) {
      for (const e of day.entries) (first[e.id] ??= {})[key] ??= { date: day.date, hhmm: e.hhmm }
    }
  }
  return all
    .filter((a) => first[a.id])
    .map((a) => {
      const c = toCardView(a)
      return { id: a.id, slug: a.slug, title: a.title, place: c.hostName, price: c.priceFrom, coverUrl: c.coverUrl, occ: first[a.id] }
    })
}

/** Pueblos cercanos que carga el administrador, con sus eventos vinculados (los de cada pueblo salen del detalle cacheado de cada evento). */
async function loadEscapadas(): Promise<EscapadaIn[]> {
  const list = await createServerContainer().escapadasService.listActive()
  return Promise.all(list.map(async (e) => {
    const events = (await Promise.all(e.eventIds.map(fetchEvent))).filter((x): x is Events => !!x && x.status === "published")
    return { id: e.id, name: e.name, minutesAway: e.minutesAway, coverUrl: e.coverUrl, plans: events.map((x) => ({ title: x.title, href: `/eventos/${x.slug || x.id}`, startsAt: x.startDate.getTime(), endsAt: x.endDate.getTime() })) }
  }))
}

async function loadSites(now: Date): Promise<SiteIn[]> {
  const ids = await createServerContainer().sitesService.getAllSites()
  const sites = (await Promise.all(ids.map(fetchSite))).filter((s): s is SiteDetail => !!s)
  const nowMins = Number(now.toLocaleString("en-GB", { timeZone: "America/Bogota", hour: "2-digit", hourCycle: "h23" })) * 60 + Number(now.toLocaleString("en-GB", { timeZone: "America/Bogota", minute: "2-digit" }))
  const toMins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0) }
  return sites.flatMap((s): SiteIn[] => {
    if (s.temporarilyClosed?.isClosed) return []
    const st = getSiteOpenStatus(s.schedule, now, { policy: s.openingPolicy ?? null })
    const [open, close] = st.todayHours?.split(" – ") ?? []
    const at = st.isOpen ? close : open && nowMins < toMins(open) ? open : null
    if (!st.isOpen && !at) return []
    const hours = open && close ? `Hoy ${clockText(open)} – ${clockText(close)}` : undefined
    return [{
      id: s.id, slug: s.slug, name: s.name, kind: siteCategoryLabel(s.category), coverUrl: s.coverUrl || null, isOpen: st.isOpen, at: at ?? null,
      address: s.address, hours, likes: s.analytics?.likes ?? 0, eventCount: s.analytics?.eventCount ?? 0, photos: s.mediaItems?.length ?? s.mediaUrls?.length ?? 0,
    }]
  })
}

/**
 * Todo lo que pinta la portada (pestañas Hoy/Mañana/Finde/Semana, «Lo que viene», sitios y actividades), en una sola caché corta.
 * Se invalida con los tags de listas de eventos, actividades y sitios. ponytail: las horas «abierto ahora» pueden atrasarse hasta lo que dure la caché.
 */
export const fetchHomeView = async (): Promise<HomeView> => {
  "use cache"
  cacheLife("hub")
  cacheTag("event-list", "activity-list", "site-list", "escapadas", "home-view")
  const now = new Date()
  const [events, activities, sites, escapadas] = await Promise.all([loadEvents(), loadActivities(now), loadSites(now), loadEscapadas()])
  return buildHomeView({ events, activities, sites, escapadas, now })
}
