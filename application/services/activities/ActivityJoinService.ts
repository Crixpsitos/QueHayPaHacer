import type { Activity } from "@/domain/entities/activities/Activity"
import { JOIN_HORIZON_DAYS, initialJoinStatus, isPaidActivity, joinDecision, normalizePhoneCo, resolveOccurrenceKey, spotsLeft, type JoinStatusValue } from "@/domain/entities/activities/activityJoin"
import { upcomingDepartures } from "@/domain/entities/activities/activityRequest"
import { normalizeExtraPicks, type ExtraPick } from "@/domain/entities/activities/reservationExtras"
import type { Extra } from "@/domain/entities/activities/value-objects/Price"
import type { IActivityJoinRepository, JoinRow } from "@/domain/repository/activities/IActivityJoinRepository"
import type { NewNotification } from "@/domain/entities/notification/Notification"
import { activityJoinConfirmedNotification, activityJoinNotification } from "@/domain/entities/notification/messages"

type Viewer = { uid: string | null; isAdmin: boolean }
type Result = { ok: true } | { ok: false; error: string }

export interface JoinDeps {
  repo: IActivityJoinRepository
  getPublic: (activityId: string) => Promise<Activity | null>
  getForManager: (activityId: string, viewer: Viewer) => Promise<Activity | null>
  displayName: (uid: string) => Promise<string>
  /** `id` fijo = idempotente (no repite el aviso). */
  notify: (uid: string, n: NewNotification, id?: string) => Promise<void>
  clock: () => Date
  /** Versión de Términos/Política vigente: prueba de qué texto vio quien autorizó su WhatsApp. */
  legalVersion: string
  /** Id corto para las personas anotadas a mano (`guest_<id>`). */
  newId?: () => string
}

/** Lo que la persona entrega al reservar una actividad de pago. */
export interface JoinContact {
  phone?: string
  consent?: boolean
}

export interface OccurrenceStatus {
  key: string
  /** Día civil (YYYY-MM-DD) o null en actividades sin fecha fija. */
  date: string | null
  /** Cupos libres; null = sin tope. */
  spotsLeft: number | null
  full: boolean
  joined: boolean
  /** Estado de mi reserva en esta salida (null = no estoy). */
  myStatus: JoinStatusValue | null
}
export interface JoinStatus {
  enabled: boolean
  closed: boolean
  /** La actividad cuesta: reservar pide WhatsApp y el pago se coordina fuera. */
  paid: boolean
  /** Solo se entrega a quien tiene una reserva por pagar. */
  payInstructions: string | null
  occurrences: OccurrenceStatus[]
  /** Servicios aparte que la actividad ofrece (para el «¿quieres agregar algo más?»). */
  extras: { label: string; amountCop: number }[]
}

export interface ManagerView {
  id: string
  title: string
  slug: string
  join: Activity["join"]
  paid: boolean
  views: number
  visits: number
  rows: JoinRow[]
  /** Servicios aparte que ofrece la actividad (para elegirlos al anotar o ajustar). */
  offeredExtras: Extra[]
  /** Próximas salidas entre las que se puede anotar a alguien a mano. */
  departures: { key: string; label: string }[]
}

const ID = /^[A-Za-z0-9-]{1,128}$/ // sin "_": el id de inscripción usa "_" como separador
const KEY = /^(open|\d{4}-\d{2}-\d{2})$/
const NOT_FOUND = "Esa actividad no existe."
const dateLabel = (key: string) => (key === "open" ? null : new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Bogota" }).format(new Date(`${key}T12:00:00-05:00`)))

/** Unirse con cuenta a una salida (una inscripción por persona y salida), con cupo opcional y cierre manual. */
export class ActivityJoinService {
  constructor(private readonly d: JoinDeps) {}

  async join(uid: string, activityId: string, requestedDate: string | null, contact: JoinContact = {}, extras: unknown = []): Promise<Result & { key?: string }> {
    if (!uid?.trim() || !activityId?.trim()) return { ok: false, error: "Inicia sesión para unirte." }
    const a = await this.d.getPublic(activityId)
    if (!a) return { ok: false, error: NOT_FOUND }
    if (!a.join) return { ok: false, error: "Esta actividad no recibe inscripciones aquí." }
    const k = resolveOccurrenceKey(a.schedule, requestedDate, this.d.clock())
    if (!k.ok) return k
    const join = a.join
    if (!this.shownRows(a).some((r) => r.key === k.key)) return { ok: false, error: "Esa salida todavía no está disponible para reservar." }
    if ((await this.d.repo.mine(activityId, uid, [k.key]))[k.key] === "noShow") return { ok: false, error: "Esa reserva se liberó por falta de pago. Escríbele a quien organiza." }
    const paid = isPaidActivity(a.priceOptions)
    let phone: string | null = null
    if (paid) {
      // dato personal: solo con consentimiento explícito y solo en actividades de pago
      if (contact.consent !== true) return { ok: false, error: "Debes autorizar compartir tu WhatsApp con quien organiza." }
      phone = normalizePhoneCo(contact.phone)
      if (!phone) return { ok: false, error: "Escribe un WhatsApp válido de 10 dígitos (empieza por 3)." }
    }
    const name = (await this.d.displayName(uid)) || "Alguien"
    const outcome = await this.d.repo.join({ activityId, key: k.key, uid, name, status: initialJoinStatus(paid), phone, consentVersion: this.d.legalVersion, extras: normalizeExtraPicks(extras, a.extras) }, (taken) => joinDecision(join, taken))
    if (outcome === "closed") return { ok: false, error: "Las inscripciones están cerradas." }
    if (outcome === "full") return { ok: false, error: "Se acabaron los cupos de esta salida." }
    if (outcome === "joined") {
      const label = dateLabel(k.key)
      // id fijo por (actividad, salida, persona): unirse y cancelar en bucle no vuelve a avisar ni llena la campanita.
      const base = `${activityId}_${k.key}_${uid}`
      await this.d.notify(a.ownerUid, activityJoinNotification({ title: a.title, activityId: a.id, who: name.slice(0, 40), dateLabel: label }), `join_${base}`)
      await this.d.notify(uid, activityJoinConfirmedNotification({ title: a.title, slug: a.slug, dateLabel: label, pending: paid }), `joinok_${base}`)
    }
    return { ok: true, key: k.key }
  }

  /** Borrar cuenta: se eliminan todas sus reservas (y el WhatsApp guardado) liberando los cupos. */
  async eraseUser(uid: string): Promise<number> {
    if (!uid?.trim()) return 0
    const mine = await this.d.repo.listByUser(uid, 1000)
    for (const m of mine) await this.d.repo.cancel({ ...m, uid })
    return mine.length
  }

  async cancel(uid: string, activityId: string, key: string): Promise<Result> {
    if (!uid?.trim() || !ID.test(activityId) || !KEY.test(key)) return { ok: false, error: "Datos inválidos." }
    await this.d.repo.cancel({ activityId, key, uid })
    return { ok: true }
  }

  /** Las próximas salidas que se ofrecen (máx. 4): también son las únicas reservables, así nadie acapara todo el calendario. */
  private shownRows(a: Activity): { key: string; date: string | null }[] {
    return upcomingDepartures(a.schedule, this.d.clock())
  }

  /** Lo que muestra la ficha: próximas salidas con cupos y si la persona ya está dentro. null = actividad no pública. */
  async status(uid: string | null, activityId: string): Promise<JoinStatus | null> {
    const a = await this.d.getPublic(activityId)
    if (!a) return null
    if (!a.join) return { enabled: false, closed: false, paid: false, payInstructions: null, occurrences: [], extras: [] }
    const rows = this.shownRows(a)
    const keys = rows.map((r) => r.key)
    const [counts, mine] = await Promise.all([this.d.repo.counts(activityId, keys), uid ? this.d.repo.mine(activityId, uid, keys) : Promise.resolve({} as Record<string, JoinStatusValue>)])
    return {
      enabled: true,
      extras: a.extras.map((x) => ({ label: x.label, amountCop: x.amountCop })),
      closed: a.join.closed,
      paid: isPaidActivity(a.priceOptions),
      payInstructions: Object.values(mine).includes("pending") ? a.join.payInstructions ?? null : null,
      occurrences: rows.map((r) => {
        const left = spotsLeft(a.join!, counts[r.key] ?? 0)
        return { key: r.key, date: r.date, spotsLeft: left, full: left === 0, joined: r.key in mine && mine[r.key] !== "noShow", myStatus: mine[r.key] ?? null }
      }),
    }
  }

  /** Lista de inscritos: solo el dueño o QHPA (la actividad se resuelve con el permiso, nunca por un uid del cliente). */
  async listForManager(viewer: Viewer, activityId: string): Promise<JoinRow[] | null> {
    const a = await this.d.getForManager(activityId, viewer)
    if (!a) return null
    return this.d.repo.list(activityId, 2000)
  }

  /** Todo lo que ve el organizador en "Reservas": datos de la actividad, métricas y la lista. null = no es suya (o no existe). */
  async managerView(viewer: Viewer, activityId: string): Promise<ManagerView | null> {
    if (!ID.test(activityId)) return null
    const a = await this.d.getForManager(activityId, viewer)
    if (!a) return null
    // sin «Unirme» también hay reservas: las anota a mano quien organiza (o vienen de una solicitud)
    const rows = await this.d.repo.list(activityId, 2000)
    const departures = upcomingDepartures(a.schedule, this.d.clock()).map((r) => ({ key: r.key, label: dateLabel(r.key) ?? "Cuando quiera" }))
    return { id: a.id, title: a.title, slug: a.slug, join: a.join, paid: isPaidActivity(a.priceOptions), views: a.analytics.views, visits: a.analytics.visits, rows, offeredExtras: a.extras, departures }
  }

  /** Confirmar pago / "No pagó" / deshacer: solo dueño o QHPA. `noShow` libera el cupo; deshacerlo lo vuelve a pedir. */
  async setStatus(viewer: Viewer, activityId: string, key: string, uid: string, to: JoinStatusValue): Promise<Result> {
    if (!ID.test(activityId) || !KEY.test(key) || !uid?.trim() || uid.includes("/") || !["pending", "confirmed", "noShow"].includes(to)) return { ok: false, error: "Datos inválidos." }
    const a = await this.d.getForManager(activityId, viewer)
    if (!a || !a.join) return { ok: false, error: "No encontramos esa actividad." }
    const join = a.join
    const r = await this.d.repo.setStatus({ activityId, key, uid, to }, (taken) => joinDecision({ ...join, closed: false }, taken))
    if (r === "missing") return { ok: false, error: "No encontramos esa reserva." }
    if (r === "full") return { ok: false, error: "Ya no hay cupo en esa salida para devolverla." }
    return { ok: true }
  }

  /** Anota a mano a una persona (sin cuenta) en una salida. Sirve también sin «Unirme»: entonces no hay tope de cupo. */
  async addManual(viewer: Viewer, activityId: string, p: { name: string; phone?: string; date: string | null; extras: unknown }): Promise<Result> {
    if (!ID.test(activityId)) return { ok: false, error: "Datos inválidos." }
    const a = await this.d.getForManager(activityId, viewer)
    if (!a) return { ok: false, error: "No encontramos esa actividad." }
    const name = (p.name ?? "").replace(/\s+/g, " ").trim().slice(0, 80)
    if (name.length < 2) return { ok: false, error: "Escribe el nombre de la persona." }
    let phone: string | null = null
    if (p.phone && p.phone.trim()) { phone = normalizePhoneCo(p.phone); if (!phone) return { ok: false, error: "El WhatsApp debe tener 10 dígitos y empezar por 3." } }
    const k = resolveOccurrenceKey(a.schedule, p.date, this.d.clock())
    if (!k.ok) return k
    if (!this.shownRows(a).some((r) => r.key === k.key)) return { ok: false, error: "Esa salida todavía no está disponible." }
    const settings = a.join ?? { capacity: null, closed: false }
    const uid = `guest_${(this.d.newId ?? (() => crypto.randomUUID().replace(/-/g, "").slice(0, 10)))()}`
    const outcome = await this.d.repo.join({ activityId, key: k.key, uid, name, status: initialJoinStatus(isPaidActivity(a.priceOptions)), phone, consentVersion: null, extras: normalizeExtraPicks(p.extras, a.extras), manual: true }, (taken) => joinDecision({ ...settings, closed: false }, taken))
    if (outcome === "full") return { ok: false, error: "Se acabaron los cupos de esta salida." }
    if (outcome !== "joined") return { ok: false, error: "No se pudo anotar. Intenta de nuevo." }
    return { ok: true }
  }

  /** Ajusta los servicios aparte de una reserva (solo dueño o QHPA). */
  async setExtras(viewer: Viewer, activityId: string, key: string, uid: string, picks: unknown): Promise<Result> {
    if (!ID.test(activityId) || !KEY.test(key) || !uid?.trim() || uid.includes("/")) return { ok: false, error: "Datos inválidos." }
    const a = await this.d.getForManager(activityId, viewer)
    if (!a) return { ok: false, error: "No encontramos esa actividad." }
    const ok = await this.d.repo.setExtras({ activityId, key, uid, extras: normalizeExtraPicks(picks, a.extras) })
    return ok ? { ok: true } : { ok: false, error: "No encontramos esa reserva." }
  }

  async setClosed(viewer: Viewer, activityId: string, closed: boolean): Promise<Result> {
    const a = await this.d.getForManager(activityId, viewer)
    if (!a || !a.join) return { ok: false, error: "No encontramos esa actividad." }
    return (await this.d.repo.setClosed(activityId, closed)) ? { ok: true } : { ok: false, error: "No encontramos esa actividad." }
  }
}
