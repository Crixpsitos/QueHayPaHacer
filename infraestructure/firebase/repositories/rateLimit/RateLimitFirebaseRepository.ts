import type { Firestore } from "firebase-admin/firestore"
import type { IRateLimitRepository } from "@/domain/repository/rateLimit/IRateLimitRepository"
import { FirebaseBaseRepository } from "../FirebaseBaseRepository"

const SAFE = /[^A-Za-z0-9_-]/g
/** `rateLimits/{clave}`: un doc por límite, en transacción (vale entre instancias). Solo Admin SDK. Los docs viejos los limpia la TTL/`purge`. */
export class RateLimitFirebaseRepository extends FirebaseBaseRepository implements IRateLimitRepository {
  protected readonly collectionName = "rateLimits"
  constructor(db: Firestore) { super(db) }
  private ref(key: string) { return this.collection.doc(key.replace(SAFE, "_").slice(0, 200)) }

  async tryHit(key: string, windowMs: number, now: Date): Promise<boolean> {
    const ref = this.ref(key)
    return this.db.runTransaction(async (tx) => {
      const s = await tx.get(ref)
      const prev = s.exists ? (s.get("at") as number) : undefined
      if (prev !== undefined && now.getTime() - prev < windowMs) return false
      tx.set(ref, { at: now.getTime(), expireAt: new Date(now.getTime() + Math.max(windowMs, 86_400_000)) })
      return true
    })
  }
  async release(key: string): Promise<void> { await this.ref(key).delete() }
  async incrementDaily(key: string, day: string, max: number): Promise<boolean> {
    const ref = this.ref(`${key}_${day}`)
    return this.db.runTransaction(async (tx) => {
      const s = await tx.get(ref)
      const n = s.exists ? (s.get("n") as number) : 0
      if (n >= max) return false
      tx.set(ref, { n: n + 1, expireAt: new Date(Date.parse(`${day}T00:00:00Z`) + 3 * 86_400_000) })
      return true
    })
  }
}
