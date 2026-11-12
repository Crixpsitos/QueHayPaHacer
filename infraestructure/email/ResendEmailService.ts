import type { EmailMessage, EmailResult, IEmailService } from "@/domain/services/IEmailService"

/**
 * Resend por HTTPS (`fetch`, sin dependencia nueva). La clave viene del entorno (`RESEND_API_KEY`, secreto de App Hosting)
 * y NUNCA se imprime. Sin clave el servicio queda desactivado: no envía nada y lo dice (modo seguro en develop/local).
 */
export class ResendEmailService implements IEmailService {
  constructor(private readonly apiKey: string | undefined, private readonly from: string | undefined, private readonly fetchImpl: typeof fetch = fetch) {}
  get enabled(): boolean { return Boolean(this.apiKey && this.from) }

  async send(m: EmailMessage): Promise<EmailResult> {
    if (!this.apiKey || !this.from) return { ok: false, error: "El correo no está configurado.", retryable: false }
    try {
      const res = await this.fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json", ...(m.idempotencyKey ? { "Idempotency-Key": m.idempotencyKey } : {}) },
        body: JSON.stringify({ from: this.from, to: [m.to], subject: m.subject, text: m.text, html: m.html, ...(m.headers ? { headers: m.headers } : {}) }),
        signal: AbortSignal.timeout(10_000),
      })
      if (res.ok) { const j = (await res.json().catch(() => ({}))) as { id?: string }; return { ok: true, id: j.id ?? "" } }
      // 429 y 5xx se reintentan; 4xx (dirección inválida, dominio sin verificar) no.
      return { ok: false, error: `Resend respondió ${res.status}`, retryable: res.status === 429 || res.status >= 500 }
    } catch {
      return { ok: false, error: "No se pudo contactar a Resend.", retryable: true }
    }
  }
}
