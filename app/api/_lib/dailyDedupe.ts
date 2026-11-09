import { createHash, randomBytes } from "node:crypto"

const DAY = 24 * 3600_000

/**
 * Descarta repetidos de la misma persona en 24 h usando SHA-256(IP + UA + sal) en memoria: ni IP ni UA quedan guardados
 * y la sal es aleatoria por instancia (se pierde al reiniciar; no se puede revertir ni cruzar entre días).
 * ponytail: por instancia de Cloud Run (varias = algún repetido pasa) y acotado a `max` claves (al pasarlo se vacía);
 * el techo real son los topes por IP y global de la ruta.
 */
export function createDailyDedupe(now: () => number = Date.now, max = 50_000) {
  const salt = randomBytes(16)
  const seen = new Map<string, number>() // hash → vence
  return {
    /** true si ya se vio (y no se vuelve a contar); si no, lo marca como visto. */
    isRepeat(ip: string, ua: string, resource: string): boolean {
      const t = now()
      const key = `${createHash("sha256").update(salt).update(ip).update("\0").update(ua).digest("hex")}:${resource}`
      const expires = seen.get(key)
      if (expires !== undefined && expires > t) return true
      if (seen.size >= max) seen.clear()
      seen.set(key, t + DAY)
      return false
    },
    size: () => seen.size,
    keys: () => [...seen.keys()],
  }
}
