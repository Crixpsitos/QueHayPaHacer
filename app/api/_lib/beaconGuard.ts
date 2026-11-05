/** Protección común de los beacons públicos que escriben contadores (visitas de sitios, banners). Sin Firestore. */

/**
 * Tope TOTAL por minuto en esta instancia (además del tope por IP): si algo lo supera, se descarta en silencio.
 * ponytail: es por instancia (Cloud Run); con varias el tope real es mayor, pero acotado por `maxInstances`.
 */
export function createGlobalLimiter(perMinute: number, now: () => number = Date.now) {
  let n = 0
  let reset = 0
  return (count = 1): boolean => {
    const t = now()
    if (t >= reset) {
      n = 0
      reset = t + 60_000
    }
    n += count
    return n <= perMinute
  }
}

/** Solo peticiones que salen de nuestra propia página. Sin Sec-Fetch-Site (navegadores viejos) se compara Origin con Host. */
export function isSameOriginBeacon(headers: Headers): boolean {
  const site = headers.get("sec-fetch-site")
  if (site) return site === "same-origin"
  const origin = headers.get("origin")
  const host = headers.get("host")
  try {
    return Boolean(origin && host && new URL(origin).host === host)
  } catch {
    return false
  }
}

/** JSON del cuerpo, o null si no es JSON, trae otro Content-Type o supera `maxBytes`. */
export async function readBoundedJson(request: Request, maxBytes: number): Promise<unknown | null> {
  if (!(request.headers.get("content-type") ?? "").startsWith("application/json")) return null
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes) return null
  const text = await request.text().catch(() => "")
  if (text.length > maxBytes) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
