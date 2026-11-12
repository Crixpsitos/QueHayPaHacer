export interface EmailEvent { type: string; emailId: string; bounceType?: string }

export interface EventsDeps {
  uidByEmailId: (emailId: string) => Promise<string | null>
  /** Baja de TODO el correo (la misma de «Dejar de recibir correos»). */
  unsubscribe: (uid: string) => Promise<void>
  /** Deja constancia (idempotente por `id`): true si es la primera vez. */
  record: (id: string, data: { uid: string; type: string; at: Date }) => Promise<boolean>
  clock: () => Date
  log: (message: string) => void
}

/**
 * Webhooks de Resend. Una queja de spam o un rebote DEFINITIVO apagan el correo de esa persona (insistir daña la reputación
 * del dominio). Un rebote temporal (buzón lleno) se ignora: Resend ya reintenta. Idempotente: Resend puede repetir el aviso.
 */
export class EmailEventsService {
  constructor(private readonly d: EventsDeps) {}

  async handle(e: EmailEvent): Promise<"unsubscribed" | "ignored"> {
    const hard = e.type === "email.bounced" && (e.bounceType ?? "").toLowerCase() === "permanent"
    if (!(e.type === "email.complained" || hard)) return "ignored"
    const uid = await this.d.uidByEmailId(e.emailId)
    if (!uid) return "ignored"
    if (!(await this.d.record(`${e.emailId}_${e.type}`, { uid, type: e.type, at: this.d.clock() }))) return "ignored"
    await this.d.unsubscribe(uid)
    this.d.log(`alert=qhpa_email_${e.type === "email.complained" ? "complaint" : "bounce"} uid=${uid}`)
    return "unsubscribed"
  }
}
