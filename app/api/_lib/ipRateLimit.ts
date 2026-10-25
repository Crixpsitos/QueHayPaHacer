/**
 * Tope por IP y minuto, en memoria de cada instancia.
 * ponytail: con varias instancias de Cloud Run el tope real es mayor; Redis/Firestore si hace falta.
 */
export function createIpLimiter(perMinute: number) {
  const hits = new Map<string, { n: number; reset: number }>()
  return (ip: string, n = 1): boolean => {
    const now = Date.now()
    const h = hits.get(ip)
    if (!h || h.reset < now) {
      if (hits.size > 5000) hits.clear()
      hits.set(ip, { n, reset: now + 60_000 })
      return true
    }
    h.n += n
    return h.n <= perMinute
  }
}

export const clientIp = (request: Request): string =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
