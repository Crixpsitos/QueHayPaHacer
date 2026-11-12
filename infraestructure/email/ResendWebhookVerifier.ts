import { Resend } from "resend"
import type { EmailEvent } from "@/application/services/email/EmailEventsService"

/**
 * Verifica la firma de un webhook de Resend (Svix) con el secreto `RESEND_WEBHOOK_SECRET` y devuelve solo lo que usamos.
 * Firma inválida, secreto ausente o evento ajeno a correos → null (la ruta responde 400 sin procesar nada).
 */
export function verifyResendWebhook(payload: string, headers: Headers, secret: string | undefined): EmailEvent | null {
  if (!secret) return null
  try {
    const ev = new Resend("re_webhook_verify").webhooks.verify({ payload, headers: { id: headers.get("svix-id") ?? "", timestamp: headers.get("svix-timestamp") ?? "", signature: headers.get("svix-signature") ?? "" }, webhookSecret: secret })
    if (!ev.type.startsWith("email.")) return null
    const data = (ev as unknown as { data: { email_id?: string; bounce?: { type?: string } } }).data
    if (!data?.email_id) return null
    return { type: ev.type, emailId: data.email_id, bounceType: data.bounce?.type }
  } catch {
    return null
  }
}
