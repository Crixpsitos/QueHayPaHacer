import { cacheLife, cacheTag } from "next/cache"
import { createServerContainer } from "@/infraestructure/di/container"
import { buildWeekendDigest, type Digest, type DigestActivity, type DigestEvent } from "@/domain/entities/activities/weeklyDigest"
import { allOnRequest, priceFromCop, formatCop } from "@/domain/entities/activities/value-objects/Price"
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
    .map((e) => ({ id: e.id, title: e.title, start: e.startDate, end: e.endDate, place: e.location?.venue ?? "", url: `/eventos/${e.slug || e.id}`, imageUrl: e.mainImage?.url }))
  const names = new Map<string, string>()
  for (const siteId of new Set(acts.items.map((a) => a.siteId).filter((x): x is string => !!x))) names.set(siteId, (await c.sitesService.getActivityLinkSnapshot(siteId))?.name ?? "")
  const activities: DigestActivity[] = acts.items.map((a) => {
    const from = priceFromCop(a.priceOptions)
    return { id: a.id, title: a.title, schedule: a.schedule, priceFrom: allOnRequest(a.priceOptions) ? "Consultar precio" : from === 0 ? "Gratis" : `Desde ${formatCop(from)}`, place: (a.siteId && names.get(a.siteId)) || a.meetingPoint.text, url: `/actividades/${a.slug}`, imageUrl: a.media.find((m) => m.type === "image" && m.isCover && m.status !== "error")?.url }
  })
  return buildWeekendDigest(events, activities, new Date())
}
