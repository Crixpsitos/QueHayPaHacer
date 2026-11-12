import { unsubscribeHeaders } from "@/domain/entities/email/unsubscribeToken"
import { organizerEmptyEmail, organizerWeeklyEmail, type BuiltEmail, type EmailModel, type OrganizerLine } from "@/domain/entities/email/templates"
import { bogotaDateIso, occurrencesBetween } from "@/domain/entities/activities/value-objects/occurrences"
import type { ActivitySchedule } from "@/domain/entities/activities/value-objects/ActivitySchedule"
import type { OutboxItem } from "@/domain/repository/email/IEmailOutboxRepository"

export interface OrganizerActivity { id: string; title: string; slug: string; ownerUid: string; schedule: ActivitySchedule }
export interface OrganizerDeps {
  /** Actividades publicadas que reciben inscripciones. */
  activities: () => Promise<OrganizerActivity[]>
  counts: (activityId: string, keys: string[]) => Promise<Record<string, number>>
  /** Fechas de inscripción de la actividad (todas las salidas). */
  joinDates: (activityId: string) => Promise<Date[]>
  allows: (uid: string) => Promise<boolean>
  getEmail: (uid: string) => Promise<string | null>
  enqueue: (item: OutboxItem) => Promise<boolean>
  siteUrl: string
  secret: string | undefined
  clock: () => Date
  render: (m: EmailModel) => Promise<string>
}

const DAY = 86_400_000
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10)
const whenLabel = (iso: string) => new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`))

/**
 * Correos para quien organiza: (1) salida de pasado mañana sin inscritos → empujón para compartirla; (2) lunes: cuántas personas
 * se anotaron en la semana. Idempotentes por id (la corrida diaria puede repetirse). Van por el permiso «transaccional».
 */
export class OrganizerEmailRunner {
  constructor(private readonly d: OrganizerDeps) {}

  async run(): Promise<{ empty: number; weekly: number }> {
    if (!this.d.secret) return { empty: 0, weekly: 0 }
    const now = this.d.clock(), today = bogotaDateIso(now), target = addDays(today, 2)
    const monday = new Date(now.getTime() - 5 * 3_600_000).getUTCDay() === 1
    let empty = 0
    const perOwner = new Map<string, OrganizerLine[]>()
    for (const a of await this.d.activities()) {
      if (occurrencesBetween(a.schedule, target, target).length > 0 && (await this.d.counts(a.id, [target]))[target] === 0) {
        const e = organizerEmptyEmail({ title: a.title, path: `/actividades/${a.slug}`, when: whenLabel(target) }, this.ctx(a.ownerUid))
        if (await this.queue(a.ownerUid, `og_empty_${a.id}_${target}`, e, now)) empty++
      }
      if (monday) {
        const since = now.getTime() - 7 * DAY
        const count = (await this.d.joinDates(a.id)).filter((x) => x.getTime() >= since).length
        if (count > 0) perOwner.set(a.ownerUid, [...(perOwner.get(a.ownerUid) ?? []), { title: a.title, count, path: `/actividades/${a.id}/inscritos` }])
      }
    }
    let weekly = 0
    for (const [uid, lines] of perOwner) if (await this.queue(uid, `og_week_${uid}_${today}`, organizerWeeklyEmail(lines, this.ctx(uid)), now)) weekly++
    return { empty, weekly }
  }

  private ctx(uid: string) { return { siteUrl: this.d.siteUrl, unsubscribeUrl: unsubscribeHeaders(this.d.siteUrl, uid, this.d.secret!).link } }

  private async queue(uid: string, id: string, e: BuiltEmail, now: Date): Promise<boolean> {
    if (!(await this.d.allows(uid))) return false
    const to = await this.d.getEmail(uid)
    if (!to) return false
    return this.d.enqueue({ id, uid, to, kind: "transactional", subject: e.subject, text: e.text, html: await this.d.render(e.model), headers: unsubscribeHeaders(this.d.siteUrl, uid, this.d.secret!).headers, status: "queued", attempts: 0, sendAfter: now, createdAt: now })
  }
}
