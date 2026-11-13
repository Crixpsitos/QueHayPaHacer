import type { Activity } from "@/domain/entities/activities/Activity"
import { REQUESTS_SHOWN, REQUEST_TTL_MS, isRequestCta, requestState, upcomingDepartures, type RequestState } from "@/domain/entities/activities/activityRequest"
import { resolveOccurrenceKey } from "@/domain/entities/activities/activityJoin"
import type { IActivityRequestRepository } from "@/domain/repository/activities/IActivityRequestRepository"
import type { NewNotification } from "@/domain/entities/notification/Notification"
import { activityRequestNotification } from "@/domain/entities/notification/messages"

type Viewer = { uid: string | null; isAdmin: boolean }
export interface RequestDeps {
  repo: IActivityRequestRepository
  getPublic: (activityId: string) => Promise<Activity | null>
  getForManager: (activityId: string, viewer: Viewer) => Promise<Activity | null>
  displayName: (uid: string) => Promise<string>
  /** `id` fijo = idempotente. */
  notify: (uid: string, n: NewNotification, id?: string) => Promise<void>
  clock: () => Date
}
export interface DepartureView { key: string; label: string }
export interface RequestView { key: string; label: string; who: string; createdAt: number; state: RequestState }

const dateLabel = (key: string) => (key === "open" ? "Cuando quiera" : new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Bogota" }).format(new Date(`${key}T12:00:00-05:00`)))

/** Solicitudes de reserva de quienes tienen cuenta (ver `domain/entities/activities/activityRequest.ts`). */
export class ActivityRequestService {
  constructor(private readonly d: RequestDeps) {}

  /** Salidas entre las que se puede elegir (sin necesidad de sesión: la ficha las muestra antes de iniciar sesión). */
  async options(activityId: string): Promise<DepartureView[]> {
    const a = await this.d.getPublic(activityId)
    if (!a) return []
    return upcomingDepartures(a.schedule, this.d.clock()).map((r) => ({ key: r.key, label: dateLabel(r.key) }))
  }

  async request(uid: string, activityId: string, requestedDate: string | null): Promise<{ ok: true; key: string; created: boolean } | { ok: false; error: string }> {
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
    const created = await this.d.repo.put(activityId, { key: k.key, uid, name, createdAt: now.getTime() }, REQUEST_TTL_MS, now.getTime())
    // avisa una sola vez por (actividad, salida, persona): tocar el botón de nuevo no llena la campanita
    if (created) await this.d.notify(a.ownerUid, activityRequestNotification({ title: a.title, activityId: a.id, who: name, dateLabel: k.key === "open" ? null : dateLabel(k.key) }), `req_${activityId}_${k.key}_${uid}_${Math.floor(now.getTime() / REQUEST_TTL_MS)}`)
    return { ok: true, key: k.key, created }
  }

  /** Para quien organiza: las últimas solicitudes con su estado (vigente o vencida, calculado al leer). null si la actividad no es suya. */
  async listForOwner(viewer: Viewer, activityId: string): Promise<RequestView[] | null> {
    if (!(await this.d.getForManager(activityId, viewer))) return null
    const now = this.d.clock().getTime()
    return (await this.d.repo.list(activityId, REQUESTS_SHOWN)).map((r) => ({ key: r.key, label: dateLabel(r.key), who: r.name, createdAt: r.createdAt, state: requestState(r.createdAt, now) }))
  }
}
