import type { IRateLimitRepository } from "@/domain/repository/rateLimit/IRateLimitRepository"

/** Misma regla en memoria: para pruebas y como respaldo cuando no hay base. NO sirve entre instancias. */
export class InMemoryRateLimit implements IRateLimitRepository {
  private readonly hits = new Map<string, number>()
  private readonly daily = new Map<string, number>()
  async tryHit(key: string, windowMs: number, now: Date): Promise<boolean> {
    const prev = this.hits.get(key)
    if (prev !== undefined && now.getTime() - prev < windowMs) return false
    this.hits.set(key, now.getTime())
    return true
  }
  async release(key: string): Promise<void> { this.hits.delete(key) }
  async incrementDaily(key: string, day: string, max: number): Promise<boolean> {
    const k = `${key}|${day}`
    const n = this.daily.get(k) ?? 0
    if (n >= max) return false
    this.daily.set(k, n + 1)
    return true
  }
}
