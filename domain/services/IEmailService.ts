export interface EmailMessage {
  to: string
  subject: string
  text: string
  html: string
  /** Cabeceras extra (List-Unsubscribe, List-Unsubscribe-Post). */
  headers?: Record<string, string>
  /** Para evitar duplicados si se reintenta. */
  idempotencyKey?: string
  /** Etiquetas visibles en el panel de Resend (p. ej. `kind`) para medir cada tipo de correo. */
  tags?: { name: string; value: string }[]
}
export type EmailResult = { ok: true; id: string } | { ok: false; error: string; retryable: boolean }
export interface IEmailService {
  send(m: EmailMessage): Promise<EmailResult>
  /** Hasta 100 correos en una llamada. Devuelve un resultado por correo, en el mismo orden. */
  sendBatch(ms: EmailMessage[]): Promise<EmailResult[]>
}
