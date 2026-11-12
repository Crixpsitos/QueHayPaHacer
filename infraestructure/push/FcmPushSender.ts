import { getMessaging } from "firebase-admin/messaging"
import { getAdminApp } from "@/infraestructure/firebase/config/admin/firebase"
import type { IPushSender, PushPayload, PushSendResult } from "@/domain/repository/push/IPushTokenRepository"

const INVALID = new Set(["messaging/registration-token-not-registered", "messaging/invalid-registration-token", "messaging/invalid-argument"])

/** Envío por Firebase Cloud Messaging (Admin SDK, mensaje de datos: el service worker `/sw.js` lo dibuja). */
export class FcmPushSender implements IPushSender {
  async send(token: string, p: PushPayload): Promise<PushSendResult> {
    try {
      await getMessaging(getAdminApp()).send({ token, data: { title: p.title, body: p.body, href: p.href }, webpush: { headers: { TTL: "86400", Urgency: "normal" } } })
      return { ok: true }
    } catch (e) {
      return { ok: false, invalidToken: INVALID.has((e as { code?: string }).code ?? "") }
    }
  }
}
