import type { ActivityCardView } from "@/presentation/activities/lib/publicView"
import type { IPlanExtrasRepository } from "@/domain/repository/activities/IPlanExtrasRepository"
import type { PlanSlot } from "@/domain/entities/activities/weekPlan"
import { bogotaDateIso } from "@/domain/entities/activities/value-objects/occurrences"

export interface PlanExtrasDeps {
  repo: IPlanExtrasRepository
  getEvent: (id: string) => Promise<{ id: string; slug: string; title: string; venue: string; startDate: Date; endDate: Date; imageUrl: string | null; priceLabel: string; published: boolean } | null>
  getSite: (id: string) => Promise<{ id: string; slug: string; name: string; coverUrl: string | null; address: string; published: boolean } | null>
  clock: () => Date
}

const LIMIT = 40
const EMPTY_SCHEDULE = { rules: [], skipDates: [], requiresReservation: false } as ActivityCardView["schedule"]
const bogotaTime = (d: Date) => { const t = new Date(d.getTime() - 5 * 3_600_000); return `${String(t.getUTCHours()).padStart(2, "0")}:${String(t.getUTCMinutes()).padStart(2, "0")}` }
const dateText = (d: Date) => new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(d)

/** Eventos («Voy a ir») y sitios guardados, ya con forma de tarjeta para entrar a «Mis planes». Los eventos traen su día y hora. */
export class PlanExtrasService {
  constructor(private readonly d: PlanExtrasDeps) {}

  async mine(uid: string): Promise<{ cards: ActivityCardView[]; slots: Record<string, PlanSlot> }> {
    if (!uid?.trim()) return { cards: [], slots: {} }
    const now = this.d.clock()
    const [eventIds, siteIds] = await Promise.all([this.d.repo.likedEventIds(uid, LIMIT), this.d.repo.likedSiteIds(uid, LIMIT)])
    const [events, sites] = await Promise.all([Promise.all(eventIds.map((id) => this.d.getEvent(id))), Promise.all(siteIds.map((id) => this.d.getSite(id)))])
    const cards: ActivityCardView[] = []
    const slots: Record<string, PlanSlot> = {}
    for (const e of events) {
      if (!e || !e.published || e.endDate.getTime() < now.getTime()) continue
      const id = `event_${e.id}`
      slots[id] = { date: bogotaDateIso(e.startDate), time: bogotaTime(e.startDate) }
      cards.push({ id, slug: e.slug, href: `/eventos/${e.slug}`, title: e.title, hostName: e.venue, hostPhoto: "", categorySlug: "otros", categoryName: "Evento", coverUrl: e.imageUrl, coverAlt: e.title, priceFrom: e.priceLabel, badge: null, scheduleText: dateText(e.startDate), schedule: EMPTY_SCHEDULE })
    }
    for (const s of sites) {
      if (!s || !s.published) continue
      cards.push({ id: `site_${s.id}`, slug: s.slug, href: `/donde-ir/${s.slug}`, title: s.name, hostName: s.address || "Sitio", hostPhoto: "", categorySlug: "otros", categoryName: "Sitio", coverUrl: s.coverUrl, coverAlt: s.name, priceFrom: "", badge: null, scheduleText: "Lugar para visitar", schedule: EMPTY_SCHEDULE })
    }
    return { cards, slots }
  }
}
