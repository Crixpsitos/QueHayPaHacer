import { cacheLife, cacheTag } from "next/cache"
import { createServerContainer } from "@/infraestructure/di/container"
import { buildWeekendDigest, type Digest, type DigestActivity, type DigestEvent } from "@/domain/entities/activities/weeklyDigest"
import { onRequestLabel, allOnRequest, priceFromCop, formatCop } from "@/domain/entities/activities/value-objects/Price"
import { loadPublishedEvents } from "@/presentation/home/data/fetchHomeView"
import { formatPrice } from "@/presentation/events/components/detail/format"
import type { ValueItem } from "@/domain/entities/email/templates"
import { fetchEventDetailById } from "@/presentation/events/data/eventDetailFetchers"

/** El resumen del fin de semana con datos reales y vigentes. Caché corta: se revisa a mano antes de publicarlo. */
export const fetchWeekendDigest = async (): Promise<Digest> => {
  "use cache"
  cacheLife("minutes")
  cacheTag("activity-list", "event-list")
  const c = createServerContainer()
  const [ids, acts] = await Promise.all([c.eventFeed.getWeekend(), c.activityService.search({ when: "este-fin-de-semana" }, 0, 200)])
  const events: DigestEvent[] = (await Promise.all(ids.map((id) => fetchEventDetailById(id).catch(() => null))))
    .filter((e): e is NonNullable<typeof e> => !!e && e.status === "published")
    .map((e) => ({ id: e.id, title: e.title, start: e.startDate, end: e.endDate, place: e.location?.venue ?? "", url: `/eventos/${e.slug || e.id}`, imageUrl: e.mainImage?.url, score: e.analytics?.score }))
  const names = new Map<string, string>()
  for (const siteId of new Set(acts.items.map((a) => a.siteId).filter((x): x is string => !!x))) names.set(siteId, (await c.sitesService.getActivityLinkSnapshot(siteId))?.name ?? "")
  const activities: DigestActivity[] = acts.items.map((a) => {
    const from = priceFromCop(a.priceOptions)
    return { id: a.id, title: a.title, schedule: a.schedule, priceFrom: allOnRequest(a.priceOptions) ? onRequestLabel(a.priceOptions) : from === 0 ? "Gratis" : `Desde ${formatCop(from)}`, place: (a.siteId && names.get(a.siteId)) || a.meetingPoint.text, url: `/actividades/${a.slug}`, imageUrl: a.media.find((m) => m.type === "image" && m.isCover && m.status !== "error")?.url }
  })
  const digest = buildWeekendDigest(events, activities, new Date())
  // sitios para ir cuando quieras: los destacados y algunos al azar (el correo escoge unos pocos por persona y fecha)
  const siteIds = [...new Set([...(await c.sitesService.getFeaturedSites().catch(() => [])), ...(await c.sitesService.getRandomSites(8).catch(() => []))])].slice(0, 12)
  const sites = (await Promise.all(siteIds.map((id) => c.sitesService.getSiteDetailById(id).catch(() => null))))
    .flatMap((s) => (s ? [{ title: s.name, url: `/donde-ir/${s.slug || s.id}`, place: s.address ?? "", imageUrl: s.coverUrl ?? s.mediaUrls?.[0] }] : []))
  return { ...digest, ...(sites.length ? { sites } : {}) }
}

const mailDay = new Intl.DateTimeFormat("es-CO", { weekday: "short", day: "numeric", month: "short", timeZone: "America/Bogota" })
const mailHour = new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Bogota" })

/** Eventos de las próximas 3 semanas para el «Para ti»: los mejor puntuados primero, con fecha completa (día, mes y hora) y su foto. */
export const fetchUpcomingEventsForEmail = async (): Promise<ValueItem[]> => {
  const now = Date.now()
  const horizon = now + 21 * 86_400_000
  return (await loadPublishedEvents())
    .filter((e) => e.endDate.getTime() >= now && e.startDate.getTime() <= horizon)
    .sort((a, b) => (b.analytics?.score ?? 0) - (a.analytics?.score ?? 0) || a.startDate.getTime() - b.startDate.getTime())
    .slice(0, 6)
    .map((e) => ({ title: e.title, when: `${mailDay.format(e.startDate).replace(/[.,]/g, "").replace(" de ", " ")} · ${mailHour.format(e.startDate).replace(/\s/g, " ")}`, path: `/eventos/${e.slug || e.id}`, place: e.location?.venue ?? "", price: formatPrice(e.price), imageUrl: e.mainImage?.status === "error" ? undefined : e.mainImage?.url }))
}
