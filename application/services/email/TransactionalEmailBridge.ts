import { transactionalEmailFor, type EmailModel } from "@/domain/entities/email/templates"
import { unsubscribeHeaders } from "@/domain/entities/email/unsubscribeToken"
import type { OutboxItem } from "@/domain/repository/email/IEmailOutboxRepository"

export interface BridgeDeps {
  allows: (uid: string) => Promise<boolean>
  getEmail: (uid: string) => Promise<string | null>
  enqueue: (item: OutboxItem) => Promise<boolean>
  siteUrl: string
  /** Secreto de la baja con un clic. Sin él NO se envía correo (no habría cómo darse de baja). */
  secret: string | undefined
  clock: () => Date
  /** Dibuja el HTML del correo (React). */
  render: (m: EmailModel) => Promise<string>
}

/** Convierte los avisos de la campanita de una reserva (confirmación, «mañana sale», último cupo) en correo transaccional. Nunca rompe el flujo que lo llama. */
export class TransactionalEmailBridge {
  constructor(private readonly d: BridgeDeps) {}

  async fromNotification(uid: string, n: { type: string; title: string; body?: string; href?: string }, id?: string): Promise<void> {
    try {
      if (!this.d.secret) return
      if (!(await this.d.allows(uid))) return
      const to = await this.d.getEmail(uid)
      if (!to) return
      const u = unsubscribeHeaders(this.d.siteUrl, uid, this.d.secret)
      const built = transactionalEmailFor(n, { siteUrl: this.d.siteUrl, unsubscribeUrl: u.link })
      if (!built) return
      const now = this.d.clock()
      // «se unió»: un solo correo por actividad y hora (varias personas seguidas no llenan el buzón)
      const key = n.type === "activity_join" ? `${n.href ?? ""}_${now.toISOString().slice(0, 13)}`.replace(/[^A-Za-z0-9_-]/g, "") : (id ?? now.toISOString().slice(0, 10))
      await this.d.enqueue({ id: `tx_${uid}_${n.type}_${key}`.slice(0, 200), uid, to, kind: "transactional", subject: built.subject, text: built.text, html: await this.d.render(built.model), headers: u.headers, status: "queued", attempts: 0, sendAfter: now, createdAt: now })
    } catch (e) {
      console.warn("[email-bridge]", e instanceof Error ? e.message : "error")
    }
  }
}
