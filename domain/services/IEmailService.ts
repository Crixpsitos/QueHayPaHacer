export interface EmailMessage {
  to: string
  subject: string
  text: string
  html: string
  /** Cabeceras extra (List-Unsubscribe, List-Unsubscribe-Post). */
  headers?: Record<string, string>
  /** Para evitar duplicados si se reintenta. */
  idempotencyKey?: string
}
export type EmailResult = { ok: true; id: string } | { ok: false; error: string; retryable: boolean }
export interface IEmailService { send(m: EmailMessage): Promise<EmailResult> }
