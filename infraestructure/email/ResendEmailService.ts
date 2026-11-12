import { createHash } from "node:crypto"
import { Resend } from "resend"
import type { EmailMessage, EmailResult, IEmailService } from "@/domain/services/IEmailService"

/** Lo mínimo del cliente de Resend que usamos (permite probar sin red). */
export interface ResendLike {
  emails: { send(payload: Record<string, unknown>, options?: { idempotencyKey?: string }): Promise<{ data: { id: string } | null; error: { message: string; statusCode: number | null } | null }> }
  batch: { send(payload: Record<string, unknown>[], options?: { idempotencyKey?: string; batchValidation?: "strict" | "permissive" }): Promise<{ data: { data: { id: string }[]; errors?: { index: number; message: string }[] } | null; error: { message: string; statusCode: number | null } | null }> }
}

export const MAX_BATCH = 100
const retryable = (status: number | null) => status === null || status === 429 || status >= 500
const payload = (from: string, m: EmailMessage) => ({ from, to: [m.to], subject: m.subject, text: m.text, html: m.html, ...(m.headers ? { headers: m.headers } : {}), ...(m.tags ? { tags: m.tags } : {}) })

/**
 * Resend con su paquete oficial. La clave viene del entorno (`RESEND_API_KEY`, secreto de App Hosting) y NUNCA se imprime.
 * Sin clave o sin remitente queda desactivado: no envía nada y lo dice (modo seguro en develop/local).
 */
export class ResendEmailService implements IEmailService {
  private readonly client: ResendLike | null
  constructor(apiKey: string | undefined, private readonly from: string | undefined, client?: ResendLike) {
    this.client = client ?? (apiKey ? (new Resend(apiKey) as unknown as ResendLike) : null)
  }
  get enabled(): boolean { return Boolean(this.client && this.from) }

  async send(m: EmailMessage): Promise<EmailResult> {
    if (!this.client || !this.from) return { ok: false, error: "El correo no está configurado.", retryable: false }
    try {
      const { data, error } = await this.client.emails.send(payload(this.from, m), m.idempotencyKey ? { idempotencyKey: m.idempotencyKey } : undefined)
      if (error || !data) return { ok: false, error: error?.message ?? "Resend no devolvió un id.", retryable: retryable(error?.statusCode ?? null) }
      return { ok: true, id: data.id }
    } catch {
      return { ok: false, error: "No se pudo contactar a Resend.", retryable: true }
    }
  }

  async sendBatch(ms: EmailMessage[]): Promise<EmailResult[]> {
    if (!ms.length) return []
    if (!this.client || !this.from) return ms.map(() => ({ ok: false as const, error: "El correo no está configurado.", retryable: false }))
    if (ms.length > MAX_BATCH) throw new Error(`Máximo ${MAX_BATCH} correos por lote.`)
    try {
      // «permissive»: un correo mal escrito no tumba a los demás; los fallos vienen con su posición.
      const key = createHash("sha256").update(ms.map((m) => m.idempotencyKey ?? m.to).join("|")).digest("hex").slice(0, 64)
      const { data, error } = await this.client.batch.send(ms.map((m) => payload(this.from!, m)), { idempotencyKey: key, batchValidation: "permissive" })
      if (error || !data) return ms.map(() => ({ ok: false as const, error: error?.message ?? "Resend no devolvió resultado.", retryable: retryable(error?.statusCode ?? null) }))
      const failed = new Map((data.errors ?? []).map((e) => [e.index, e.message]))
      const ids = [...data.data]
      return ms.map((_, i) => (failed.has(i) ? { ok: false as const, error: failed.get(i)!, retryable: false } : { ok: true as const, id: ids.shift()?.id ?? "" }))
    } catch {
      return ms.map(() => ({ ok: false as const, error: "No se pudo contactar a Resend.", retryable: true }))
    }
  }
}
