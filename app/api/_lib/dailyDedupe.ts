import { createHash, randomBytes } from "node:crypto"

const DAY = 24 * 3600_000

/**
 * Descarta repetidos de la misma persona en 24 h usando SHA-256(IP + UA + sal) en memoria: ni IP ni UA quedan guardados
 * y la sal es aleatoria por instancia (se pierde al reiniciar; no se puede revertir ni cruzar entre instancias).
 * `isRepeat` solo mira; `mark` se llama DESPUÉS de que la escritura salió bien, así un descarte por tope o un fallo de la
 * base no le quita su conteo a la persona durante 24 h.
 * ponytail: por instancia de Cloud Run (varias = algún repetido pasa), acotado a `max` claves (se expulsa la más vieja);
 * detrás de CGNAT varias personas con el mismo UA cuentan como una. El techo real son los topes por IP y global de la ruta.
 */
export function createDailyDedupe(now: () => number = Date.now, max = 50_000) {
  const salt = randomBytes(16)
  const seen = new Map<string, number>() // hash → vence; el orden de inserción = el más viejo primero
  const keyOf = (ip: string, ua: string, resource: string) =>
    `${createHash("sha256").update(salt).update(ip).update("\0").update(ua).digest("hex")}:${resource}`
  return {
    isRepeat(ip: string, ua: string, resource: string): boolean {
      const expires = seen.get(keyOf(ip, ua, resource))
      return expires !== undefined && expires > now()
    },
    mark(ip: string, ua: string, resource: string): void {
      const key = keyOf(ip, ua, resource)
      seen.delete(key) // reinserta al final (renueva el vencimiento)
      seen.set(key, now() + DAY)
      if (seen.size > max) seen.delete(seen.keys().next().value as string)
    },
    size: () => seen.size,
    keys: () => [...seen.keys()],
  }
}
