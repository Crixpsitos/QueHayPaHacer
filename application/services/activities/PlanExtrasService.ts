import type { ActivityCardView } from "@/presentation/activities/lib/publicView"
import type { IPlanExtrasRepository } from "@/domain/repository/activities/IPlanExtrasRepository"
import type { PlanSlot } from "@/domain/entities/activities/weekPlan"
import { isPlanKind, isPlanRefId, planKey, planSlotError, type PlanItem, type PlanItemKind, type PlanItemSlot } from "@/domain/entities/activities/planItem"
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

export type PlanItemResult = { ok: true; item: PlanItem } | { ok: false; error: string }
const invalid = { ok: false, error: "No se pudo agregar." } as const

/**
 * Eventos y sitios que la persona agregó a su plan con «Agregar a mi plan», ya con forma de tarjeta para «Mis planes».
 * Un evento entra con su propio día y hora (son fijos); un sitio con el día y la hora que elija, o sin día.
 */
export class PlanExtrasService {
  constructor(private readonly d: PlanExtrasDeps) {}

  /** Agrega (o cambia el horario de) un evento o un sitio. Para un evento el horario sale del evento, no del cliente. */
  async add(uid: string, kind: unknown, refId: unknown, slot: PlanItemSlot | null = null): Promise<PlanItemResult> {
    if (!uid?.trim() || !isPlanKind(kind) || !isPlanRefId(refId)) return invalid
    const now = this.d.clock()
    if (kind === "event") {
      const e = await this.d.getEvent(refId)
      if (!e || !e.published) return { ok: false, error: "Este evento ya no está disponible." }
      if (e.endDate.getTime() < now.getTime()) return { ok: false, error: "Este evento ya terminó." }
      const item: PlanItem = { kind, refId, date: bogotaDateIso(e.startDate), time: bogotaTime(e.startDate) }
      await this.d.repo.put(uid, item)
      return { ok: true, item }
    }
    const s = await this.d.getSite(refId)
    if (!s || !s.published) return { ok: false, error: "Este sitio ya no está disponible." }
    const wanted = { date: slot?.date ?? null, time: slot?.date ? (slot.time ?? null) : null }
    const bad = planSlotError(wanted, bogotaDateIso(now))
    if (bad) return { ok: false, error: bad }
    const item: PlanItem = { kind, refId, ...wanted }
    await this.d.repo.put(uid, item)
    return { ok: true, item }
  }

  async remove(uid: string, kind: unknown, refId: unknown): Promise<boolean> {
    if (!uid?.trim() || !isPlanKind(kind) || !isPlanRefId(refId)) return false
    await this.d.repo.remove(uid, kind, refId)
    return true
  }

  /** ¿Ya está en mi plan, y con qué horario? */
  async state(uid: string, kind: unknown, refId: unknown): Promise<PlanItem | null> {
    if (!uid?.trim() || !isPlanKind(kind) || !isPlanRefId(refId)) return null
    return this.d.repo.get(uid, kind, refId)
  }

  async mine(uid: string): Promise<{ cards: ActivityCardView[]; slots: Record<string, PlanSlot> }> {
    if (!uid?.trim()) return { cards: [], slots: {} }
    const now = this.d.clock()
    const items = await this.d.repo.list(uid, LIMIT)
    const cards: ActivityCardView[] = []
    const slots: Record<string, PlanSlot> = {}
    await Promise.all(items.map(async (it) => {
      const id = planKey(it.kind as PlanItemKind, it.refId)
      if (it.kind === "event") {
        const e = await this.d.getEvent(it.refId)
        if (!e || !e.published || e.endDate.getTime() < now.getTime()) return
        slots[id] = { date: bogotaDateIso(e.startDate), time: bogotaTime(e.startDate) }
        cards.push({ id, slug: e.slug, href: `/eventos/${e.slug}`, title: e.title, hostName: e.venue, hostPhoto: "", categorySlug: "otros", categoryName: "Evento", coverUrl: e.imageUrl, coverAlt: e.title, priceFrom: e.priceLabel, badge: null, scheduleText: dateText(e.startDate), schedule: EMPTY_SCHEDULE })
        return
      }
      const s = await this.d.getSite(it.refId)
      if (!s || !s.published) return
      if (it.date) slots[id] = { date: it.date, time: it.time }
      cards.push({ id, slug: s.slug, href: `/donde-ir/${s.slug}`, title: s.name, hostName: s.address || "Sitio", hostPhoto: "", categorySlug: "otros", categoryName: "Sitio", coverUrl: s.coverUrl, coverAlt: s.name, priceFrom: "", badge: null, scheduleText: it.date ? "Visita" : "Sin día todavía", schedule: EMPTY_SCHEDULE })
    }))
    // el orden de la lista no depende de qué lectura terminó primero
    cards.sort((a, b) => a.id.localeCompare(b.id))
    return { cards, slots }
  }
}
