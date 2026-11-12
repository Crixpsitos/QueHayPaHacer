/** Tokens de push por dispositivo: `users/{uid}/pushTokens/{hash}` (solo Admin SDK). */
export interface IPushTokenRepository {
  add(uid: string, token: string, now: Date): Promise<void>
  remove(uid: string, token: string): Promise<void>
  list(uid: string): Promise<string[]>
}
export interface PushPayload { title: string; body: string; href: string }
export type PushSendResult = { ok: true } | { ok: false; invalidToken: boolean }
export interface IPushSender { send(token: string, p: PushPayload): Promise<PushSendResult> }
