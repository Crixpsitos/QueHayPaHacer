import type { Activity } from "@/domain/entities/activities/Activity"
import { JOIN_HORIZON_DAYS, joinDecision, resolveOccurrenceKey, spotsLeft } from "@/domain/entities/activities/activityJoin"
import { bogotaDateIso, occurrencesBetween } from "@/domain/entities/activities/value-objects/occurrences"
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
}

export interface OccurrenceStatus {
  key: string
  /** Día civil (YYYY-MM-DD) o null en actividades sin fecha fija. */
  date: string | null
  /** Cupos libres; null = sin tope. */
  spotsLeft: number | null
  full: boolean
  joined: boolean
}
export interface JoinStatus {
  enabled: boolean
  closed: boolean
  occurrences: OccurrenceStatus[]
}

const SHOWN = 4
const ID = /^[A-Za-z0-9-]{1,128}$/ // sin "_": el id de inscripción usa "_" como separador
const KEY = /^(open|\d{4}-\d{2}-\d{2})$/
const NOT_FOUND = "Esa actividad no existe."
const dateLabel = (key: string) => (key === "open" ? null : new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Bogota" }).format(new Date(`${key}T12:00:00-05:00`)))

/** Unirse con cuenta a una salida (una inscripción por persona y salida), con cupo opcional y cierre manual. */
export class ActivityJoinService {
  constructor(private readonly d: JoinDeps) {}

  async join(uid: string, activityId: string, requestedDate: string | null): Promise<Result & { key?: string }> {
    if (!uid?.trim() || !activityId?.trim()) return { ok: false, error: "Inicia sesión para unirte." }
    const a = await this.d.getPublic(activityId)
    if (!a) return { ok: false, error: NOT_FOUND }
    if (!a.join) return { ok: false, error: "Esta actividad no recibe inscripciones aquí." }
    const k = resolveOccurrenceKey(a.schedule, requestedDate, this.d.clock())
    if (!k.ok) return k
    const join = a.join
    const name = (await this.d.displayName(uid)) || "Alguien"
    const outcome = await this.d.repo.join({ activityId, key: k.key, uid, name }, (taken) => joinDecision(join, taken))
    if (outcome === "closed") return { ok: false, error: "Las inscripciones están cerradas." }
    if (outcome === "full") return { ok: false, error: "Se acabaron los cupos de esta salida." }
    if (outcome === "joined") {
      const label = dateLabel(k.key)
      // id fijo por (actividad, salida, persona): unirse y cancelar en bucle no vuelve a avisar ni llena la campanita.
      const base = `${activityId}_${k.key}_${uid}`
      await this.d.notify(a.ownerUid, activityJoinNotification({ title: a.title, activityId: a.id, who: name.slice(0, 40), dateLabel: label }), `join_${base}`)
      await this.d.notify(uid, activityJoinConfirmedNotification({ title: a.title, slug: a.slug, dateLabel: label }), `joinok_${base}`)
    }
    return { ok: true, key: k.key }
  }

  async cancel(uid: string, activityId: string, key: string): Promise<Result> {
    if (!uid?.trim() || !ID.test(activityId) || !KEY.test(key)) return { ok: false, error: "Datos inválidos." }
    await this.d.repo.cancel({ activityId, key, uid })
    return { ok: true }
  }

  /** Lo que muestra la ficha: próximas salidas con cupos y si la persona ya está dentro. null = actividad no pública. */
  async status(uid: string | null, activityId: string): Promise<JoinStatus | null> {
    const a = await this.d.getPublic(activityId)
    if (!a) return null
    if (!a.join) return { enabled: false, closed: false, occurrences: [] }
    const now = this.d.clock()
    const today = bogotaDateIso(now)
    const dated = a.schedule.rules.some((r) => r.kind !== "always" && r.kind !== "byAppointment")
    let rows: { key: string; date: string | null }[]
    if (!dated) rows = [{ key: "open", date: null }]
    else {
      const to = bogotaDateIso(new Date(now.getTime() + JOIN_HORIZON_DAYS * 86_400_000))
      const seen = new Set<string>()
      rows = []
      for (const o of occurrencesBetween(a.schedule, today, to)) {
        if (seen.has(o.date)) continue
        // la de hoy solo si no terminó
        if (o.date === today && (o.endsAt ?? o.startsAt) && (o.endsAt ?? o.startsAt)!.getTime() < now.getTime()) continue
        seen.add(o.date)
        rows.push({ key: o.date, date: o.date })
        if (rows.length >= SHOWN) break
      }
    }
    const keys = rows.map((r) => r.key)
    const [counts, mine] = await Promise.all([this.d.repo.counts(activityId, keys), uid ? this.d.repo.mine(activityId, uid, keys) : Promise.resolve([] as string[])])
    return {
      enabled: true,
      closed: a.join.closed,
      occurrences: rows.map((r) => {
        const left = spotsLeft(a.join!, counts[r.key] ?? 0)
        return { key: r.key, date: r.date, spotsLeft: left, full: left === 0, joined: mine.includes(r.key) }
      }),
    }
  }

  /** Lista de inscritos: solo el dueño o QHPA (la actividad se resuelve con el permiso, nunca por un uid del cliente). */
  async listForManager(viewer: Viewer, activityId: string): Promise<JoinRow[] | null> {
    const a = await this.d.getForManager(activityId, viewer)
    if (!a) return null
    return this.d.repo.list(activityId, 500)
  }

  async setClosed(viewer: Viewer, activityId: string, closed: boolean): Promise<Result> {
    const a = await this.d.getForManager(activityId, viewer)
    if (!a || !a.join) return { ok: false, error: "No encontramos esa actividad." }
    return (await this.d.repo.setClosed(activityId, closed)) ? { ok: true } : { ok: false, error: "No encontramos esa actividad." }
  }
}
