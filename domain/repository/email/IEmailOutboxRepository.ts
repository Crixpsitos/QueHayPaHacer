export type EmailKind = "transactional" | "forYou" | "weekly"
export interface OutboxItem {
  id: string
  uid: string
  to: string
  kind: EmailKind
  subject: string
  text: string
  html: string
  headers?: Record<string, string>
  status: "queued" | "sent" | "failed"
  attempts: number
  /** No se envía antes de este instante (reintentos). */
  sendAfter: Date
  createdAt: Date
  sentAt?: Date
  providerId?: string
  lastError?: string
}

/** `emailOutbox/{id}`: cola de correos (solo Admin SDK). */
export interface IEmailOutboxRepository {
  /** Crea el ítem; false si ese id ya existía (idempotente: el id lo arma quien encola). */
  enqueue(item: OutboxItem): Promise<boolean>
  /** Pendientes cuyo `sendAfter` ya pasó (sin orden garantizado; máx. `limit`). */
  due(now: Date, limit: number): Promise<OutboxItem[]>
  /** De quién era el correo con ese id de Resend (`email_id` de los webhooks). */
  uidByProviderId(providerId: string): Promise<string | null>
  markSent(id: string, providerId: string, at: Date): Promise<void>
  /** Reintento (`sendAfter` nuevo) o descarte (`failed`). */
  markRetry(id: string, attempts: number, sendAfter: Date | null, error: string): Promise<void>
}
