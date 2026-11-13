import type { Activity } from "@/domain/entities/activities/Activity"
import { REQUESTS_SHOWN, REQUEST_TTL_MS, isRequestCta, requestState, upcomingDepartures, type RequestState } from "@/domain/entities/activities/activityRequest"
import { initialJoinStatus, isPaidActivity, joinDecision, resolveOccurrenceKey } from "@/domain/entities/activities/activityJoin"
import { normalizeExtraPicks, type ExtraPick } from "@/domain/entities/activities/reservationExtras"
import type { IActivityJoinRepository } from "@/domain/repository/activities/IActivityJoinRepository"
import type { IActivityRequestRepository } from "@/domain/repository/activities/IActivityRequestRepository"
import type { NewNotification } from "@/domain/entities/notification/Notification"
import { activityJoinConfirmedNotification, activityRequestNotification } from "@/domain/entities/notification/messages"

type Viewer = { uid: string | null; isAdmin: boolean }
export interface RequestDeps {
  repo: IActivityRequestRepository
  /** Para pasar una solicitud a reserva (ocupa cupo en el mismo lugar que «Unirme»). */
  join: IActivityJoinRepository
  getPublic: (activityId: string) => Promise<Activity | null>
  getForManager: (activityId: string, viewer: Viewer) => Promise<Activity | null>
  displayName: (uid: string) => Promise<string>
  /** `id` fijo = idempotente. */
  notify: (uid: string, n: NewNotification, id?: string) => Promise<void>
  clock: () => Date
}
export interface DepartureView { key: string; label: string }
export interface RequestOptions { departures: DepartureView[]; extras: { label: string; amountCop: number }[] }
export interface RequestView { key: string; uid: string; label: string; who: string; createdAt: number; state: RequestState; extras: ExtraPick[] }

const dateLabel = (key: string) => (key === "open" ? "Cuando quiera" : new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Bogota" }).format(new Date(`${key}T12:00:00-05:00`)))

/** Solicitudes de reserva de quienes tienen cuenta (ver `domain/entities/activities/activityRequest.ts`). */
export class ActivityRequestService {
  constructor(private readonly d: RequestDeps) {}

  /** Salidas entre las que se puede elegir (sin necesidad de sesión: la ficha las muestra antes de iniciar sesión). */
  async options(activityId: string): Promise<RequestOptions> {
    const a = await this.d.getPublic(activityId)
    if (!a) return { departures: [], extras: [] }
    return { departures: upcomingDepartures(a.schedule, this.d.clock()).map((r) => ({ key: r.key, label: dateLabel(r.key) })), extras: a.extras.map((x) => ({ label: x.label, amountCop: x.amountCop })) }
  }

  async request(uid: string, activityId: string, requestedDate: string | null, extras: unknown = []): Promise<{ ok: true; key: string; created: boolean } | { ok: false; error: string }> {
    if (!uid?.trim() || !activityId?.trim()) return { ok: false, error: "Inicia sesión." }
    const a = await this.d.getPublic(activityId)
    if (!a) return { ok: false, error: "Esa actividad no existe." }
    if (!a.cta || !isRequestCta(a.cta.kind)) return { ok: false, error: "Esta actividad no recibe solicitudes." }
    if (a.ownerUid === uid) return { ok: false, error: "Es tu propia actividad." }
    const now = this.d.clock()
    const k = resolveOccurrenceKey(a.schedule, requestedDate, now)
    if (!k.ok) return k
    // solo entre las salidas que se ofrecen (no se puede pedir un día suelto del calendario)
    if (!upcomingDepartures(a.schedule, now).some((r) => r.key === k.key)) return { ok: false, error: "Esa salida todavía no está disponible." }
    const name = ((await this.d.displayName(uid)) || "Alguien").slice(0, 40)
    const created = await this.d.repo.put(activityId, { key: k.key, uid, name, createdAt: now.getTime(), extras: normalizeExtraPicks(extras, a.extras) }, REQUEST_TTL_MS, now.getTime())
    // avisa una sola vez por (actividad, salida, persona): tocar el botón de nuevo no llena la campanita
    if (created) await this.d.notify(a.ownerUid, activityRequestNotification({ title: a.title, activityId: a.id, who: name, dateLabel: k.key === "open" ? null : dateLabel(k.key) }), `req_${activityId}_${k.key}_${uid}_${Math.floor(now.getTime() / REQUEST_TTL_MS)}`)
    return { ok: true, key: k.key, created }
  }

  /** Para quien organiza: las últimas solicitudes con su estado (vigente o vencida, calculado al leer). null si la actividad no es suya. */
  async listForOwner(viewer: Viewer, activityId: string): Promise<RequestView[] | null> {
    if (!(await this.d.getForManager(activityId, viewer))) return null
    const now = this.d.clock().getTime()
    return (await this.d.repo.list(activityId, REQUESTS_SHOWN)).map((r) => ({ key: r.key, uid: r.uid, label: dateLabel(r.key), who: r.name, createdAt: r.createdAt, state: requestState(r.createdAt, now), extras: r.extras }))
  }

  /** De interesado a reservado: crea la reserva en esa salida (ocupa cupo, con los servicios que pidió), avisa a la persona y quita la solicitud. */
  async promote(viewer: Viewer, activityId: string, key: string, uid: string): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(activityId) || !/^(open|\d{4}-\d{2}-\d{2})$/.test(key) || !uid?.trim() || uid.includes("/")) return { ok: false, error: "Datos inválidos." }
    const a = await this.d.getForManager(activityId, viewer)
    if (!a) return { ok: false, error: "No encontramos esa actividad." }
    const req = await this.d.repo.get(activityId, key, uid)
    if (!req) return { ok: false, error: "No encontramos esa solicitud." }
    const settings = a.join ?? { capacity: null, closed: false }
    const paid = isPaidActivity(a.priceOptions)
    const out = await this.d.join.join({ activityId, key, uid, name: req.name, status: initialJoinStatus(paid), phone: null, consentVersion: null, extras: req.extras }, (taken) => joinDecision({ ...settings, closed: false }, taken))
    if (out === "full") return { ok: false, error: "Se acabaron los cupos de esta salida." }
    await this.d.repo.remove(activityId, key, uid)
    if (out === "joined") await this.d.notify(uid, activityJoinConfirmedNotification({ title: a.title, slug: a.slug, dateLabel: key === "open" ? null : dateLabel(key), pending: paid }), `joinok_${activityId}_${key}_${uid}`)
    return { ok: true }
  }
}
