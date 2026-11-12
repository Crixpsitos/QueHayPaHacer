import { unsubscribeHeaders } from "@/domain/entities/email/unsubscribeToken"
import { valueEmail, type ValueItem } from "@/domain/entities/email/templates"
import { selectForYou, type PoolItem } from "@/domain/entities/email/selection"
import type { Digest } from "@/domain/entities/activities/weeklyDigest"
import type { EmailKind, OutboxItem } from "@/domain/repository/email/IEmailOutboxRepository"

export interface RunnerDeps {
  optIns: (kind: "forYou" | "weekly") => Promise<string[]>
  allows: (uid: string, kind: "forYou" | "weekly") => Promise<boolean>
  getEmail: (uid: string) => Promise<string | null>
  signals: (uid: string) => Promise<{ categories: string[]; excludeIds: string[] }>
  /** Lo vigente de hoy y los próximos días. */
  pool: () => Promise<PoolItem[]>
  enqueue: (item: OutboxItem) => Promise<boolean>
  siteUrl: string
  secret: string | undefined
  clock: () => Date
}

const bogota = (d: Date) => new Date(d.getTime() - 5 * 3_600_000)

/** Arma los correos de valor: «Para ti» (uno por persona y día) y «Qué hacer esta semana» (jueves, uno por semana). Solo a quien lo autorizó. */
export class ValueEmailRunner {
  constructor(private readonly d: RunnerDeps) {}

  async run(weekendDigest: () => Promise<Digest>): Promise<{ forYou: number; weekly: number }> {
    if (!this.d.secret) return { forYou: 0, weekly: 0 }
    const now = this.d.clock(), local = bogota(now), day = local.toISOString().slice(0, 10)
    let forYou = 0, weekly = 0
    const pool = await this.d.pool()
    for (const uid of await this.d.optIns("forYou")) {
      if (!(await this.d.allows(uid, "forYou"))) continue
      const items = selectForYou(pool, await this.d.signals(uid))
      if (!items.length) continue
      if (await this.queue(uid, "forYou", `fy_${uid}_${day}`, items.map((i) => ({ title: i.title, when: i.when, path: i.path })), now)) forYou++
    }
    if (local.getUTCDay() === 4) { // jueves: el fin de semana ya se ve
      const digest = await weekendDigest()
      const items: ValueItem[] = digest.days.flatMap((d) => d.items.slice(0, 4).map((i) => ({ title: i.title, when: `${d.label} · ${i.timeLabel}`, path: i.url }))).slice(0, 12)
      if (items.length) for (const uid of await this.d.optIns("weekly")) {
        if (!(await this.d.allows(uid, "weekly"))) continue
        if (await this.queue(uid, "weekly", `wk_${uid}_${day}`, items, now)) weekly++
      }
    }
    return { forYou, weekly }
  }

  private async queue(uid: string, kind: Exclude<EmailKind, "transactional">, id: string, items: ValueItem[], now: Date): Promise<boolean> {
    const to = await this.d.getEmail(uid)
    if (!to || !this.d.secret) return false
    const u = unsubscribeHeaders(this.d.siteUrl, uid, this.d.secret)
    const e = valueEmail(kind, items, { siteUrl: this.d.siteUrl, unsubscribeUrl: u.link })
    return this.d.enqueue({ id, uid, to, kind, subject: e.subject, text: e.text, html: e.html, headers: u.headers, status: "queued", attempts: 0, sendAfter: now, createdAt: now })
  }
}
