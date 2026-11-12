import type { EmailKind, IEmailOutboxRepository, OutboxItem } from "@/domain/repository/email/IEmailOutboxRepository"
import type { IRateLimitRepository } from "@/domain/repository/rateLimit/IRateLimitRepository"
import type { IEmailService } from "@/domain/services/IEmailService"

const MAX_ATTEMPTS = 3
const RETRY_MS = 3_600_000
const PRIORITY: Record<EmailKind, number> = { transactional: 0, forYou: 1, weekly: 2 }
const day = (d: Date) => new Date(d.getTime() - 5 * 3_600_000).toISOString().slice(0, 10)

export interface EmailQueueDeps {
  repo: IEmailOutboxRepository
  email: IEmailService
  /** Cuota diaria compartida entre instancias. */
  rateLimit: IRateLimitRepository
  /** Tope de correos por día (`EMAIL_DAILY_CAP`; el plan gratis de Resend es 100/día). */
  cap: number
  clock: () => Date
  log: (message: string) => void
}

/** Cola de correos con tope diario: primero lo transaccional, luego lo de valor; lo que no cabe queda para mañana. */
export class EmailQueueService {
  constructor(private readonly d: EmailQueueDeps) {}

  enqueue(item: OutboxItem): Promise<boolean> { return this.d.repo.enqueue(item) }

  async drain(limit = 200): Promise<{ sent: number; failed: number; left: number }> {
    const now = this.d.clock(), today = day(now)
    const due = (await this.d.repo.due(now, limit)).sort((a, b) => PRIORITY[a.kind] - PRIORITY[b.kind] || a.createdAt.getTime() - b.createdAt.getTime())
    let sent = 0, failed = 0, used = 0
    for (const m of due) {
      if (!(await this.d.rateLimit.incrementDaily("email_sent", today, this.d.cap))) break // tope del día: el resto queda en cola
      const r = await this.d.email.send({ to: m.to, subject: m.subject, text: m.text, html: m.html, headers: m.headers, idempotencyKey: m.id })
      if (r.ok) {
        await this.d.repo.markSent(m.id, r.id, now); sent++; used++
        if (used === Math.ceil(this.d.cap * 0.8)) await this.alert80(today)
      } else {
        await this.d.rateLimit.decrementDaily("email_sent", today) // no se envió: el cupo se devuelve
        const attempts = m.attempts + 1
        const retry = r.retryable && attempts < MAX_ATTEMPTS
        await this.d.repo.markRetry(m.id, attempts, retry ? new Date(now.getTime() + RETRY_MS) : null, r.error)
        if (!retry) failed++
      }
    }
    return { sent, failed, left: due.length - sent - failed }
  }

  private async alert80(today: string): Promise<void> {
    if (await this.d.rateLimit.incrementDaily("email_cap_80_alert", today, 1)) this.d.log(`alert=qhpa_email_cap_80 cap=${this.d.cap}`)
  }
}
