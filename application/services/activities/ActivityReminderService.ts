import type { Activity } from "@/domain/entities/activities/Activity"
import { spotsLeft } from "@/domain/entities/activities/activityJoin"
import { planReminders, type ReminderActivity } from "@/domain/entities/activities/reminders"
import { bogotaDateIso, occurrencesBetween } from "@/domain/entities/activities/value-objects/occurrences"
import type { NewNotification } from "@/domain/entities/notification/Notification"

export interface ReminderDeps {
  listPublic: () => Promise<Activity[]>
  /** Quienes tienen reserva vigente en esa salida. */
  reservedFor: (activityId: string, key: string) => Promise<string[]>
  /** Cuántos cupos ocupa esa salida. */
  taken: (activityId: string, key: string) => Promise<number>
  savers: (activityId: string) => Promise<string[]>
  /** `id` fijo = idempotente. */
  notify: (uid: string, n: NewNotification, id: string) => Promise<void>
  clock: () => Date
}

const DAY_MS = 86_400_000
const dated = (a: Activity) => a.schedule.rules.some((r) => r.kind !== "always" && r.kind !== "byAppointment")
const hhmm = (d: Date | null) => (d ? new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Bogota" }).format(d).replace("a.m.", "a. m.").replace("p.m.", "p. m.") : null)

/** Barrido diario: avisos de la campanita para las salidas de mañana (reservas y guardados). Un aviso por persona y día. */
export class ActivityReminderService {
  constructor(private readonly d: ReminderDeps) {}

  async sweep(): Promise<{ activities: number; notified: number }> {
    const now = this.d.clock()
    const today = bogotaDateIso(now)
    const tomorrow = bogotaDateIso(new Date(now.getTime() + DAY_MS))
    const items: ReminderActivity[] = []
    for (const a of await this.d.listPublic()) {
      if (!dated(a)) continue
      const occ = occurrencesBetween(a.schedule, tomorrow, tomorrow)[0]
      if (!occ) continue
      const [reserved, savers, taken] = await Promise.all([
        a.join ? this.d.reservedFor(a.id, tomorrow) : Promise.resolve([] as string[]),
        this.d.savers(a.id),
        a.join ? this.d.taken(a.id, tomorrow) : Promise.resolve(0),
      ])
      items.push({ id: a.id, slug: a.slug, title: a.title, dateKey: tomorrow, timeLabel: hhmm(occ.startsAt), spotsLeft: a.join ? spotsLeft(a.join, taken) : null, reserved, savers })
    }
    const plan = planReminders(items, today)
    for (const p of plan) await this.d.notify(p.uid, p.notification, p.id)
    return { activities: items.length, notified: plan.length }
  }
}
