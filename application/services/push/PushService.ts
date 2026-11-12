import type { IPushSender, IPushTokenRepository, PushPayload } from "@/domain/repository/push/IPushTokenRepository"
import type { IRateLimitRepository } from "@/domain/repository/rateLimit/IRateLimitRepository"

export const PUSH_PER_DAY = 3
export const MAX_DEVICES = 5
const day = (d: Date) => new Date(d.getTime() - 5 * 3_600_000).toISOString().slice(0, 10)
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

export interface PushDeps {
  tokens: IPushTokenRepository
  sender: IPushSender
  rateLimit: IRateLimitRepository
  /** ¿La persona permite push? (consentimiento + interruptor). */
  allows: (uid: string) => Promise<boolean>
  clock: () => Date
  /** Sin claves de FCM/VAPID configuradas el push queda apagado. */
  enabled: boolean
}

/** Push web: solo a quien lo autorizó, con tope diario y limpieza de tokens que ya no sirven. Nunca rompe el flujo que lo llama. */
export class PushService {
  constructor(private readonly d: PushDeps) {}

  async register(uid: string, token: string): Promise<void> {
    if (!this.d.enabled) throw new Error("Los avisos en el celular todavía no están activos.")
    if (!(await this.d.allows(uid))) throw new Error("Primero activa los avisos en el celular y autoriza.")
    if (typeof token !== "string" || token.length < 20 || token.length > 4096) throw new Error("Este dispositivo no pudo registrarse.")
    if ((await this.d.tokens.list(uid)).length >= MAX_DEVICES) throw new Error(`Máximo ${MAX_DEVICES} dispositivos.`)
    await this.d.tokens.add(uid, token, this.d.clock())
  }

  unregister(uid: string, token: string): Promise<void> { return this.d.tokens.remove(uid, token) }

  /** Un aviso útil por push (campanita → push). Devuelve cuántos dispositivos lo recibieron. */
  async notify(uid: string, p: PushPayload): Promise<number> {
    try {
      if (!this.d.enabled || !(await this.d.allows(uid))) return 0
      const tokens = await this.d.tokens.list(uid)
      if (!tokens.length) return 0
      if (!(await this.d.rateLimit.incrementDaily(`push_${uid}`, day(this.d.clock()), PUSH_PER_DAY))) return 0
      const payload = { title: clip(p.title, 80), body: clip(p.body, 140), href: p.href.startsWith("/") ? p.href : "/" }
      let ok = 0
      for (const t of tokens) {
        const r = await this.d.sender.send(t, payload)
        if (r.ok) ok++
        else if (r.invalidToken) await this.d.tokens.remove(uid, t)
      }
      if (!ok) await this.d.rateLimit.decrementDaily(`push_${uid}`, day(this.d.clock()))
      return ok
    } catch (e) {
      console.warn("[push]", e instanceof Error ? e.message : "error")
      return 0
    }
  }
}
