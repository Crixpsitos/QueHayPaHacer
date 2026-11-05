/** Protección común de los beacons públicos que escriben contadores (visitas de sitios, banners). Sin Firestore. */

/**
 * Tope TOTAL por minuto en esta instancia (además del tope por IP): si algo lo supera, se descarta en silencio.
 * ponytail: es por instancia (Cloud Run); con varias el tope real es mayor, pero acotado por `maxInstances`.
 */
export function createGlobalLimiter(perMinute: number, now: () => number = Date.now, onTrip?: () => void) {
  let n = 0
  let reset = 0
  let tripped = false
  return (count = 1): boolean => {
    const t = now()
    if (t >= reset) {
      n = 0
      tripped = false
      reset = t + 60_000
    }
    n += count
    const ok = n <= perMinute
    if (!ok && !tripped) {
      tripped = true
      onTrip?.() // una vez por ventana: lo descartado es silencioso para el cliente, pero no para quien opera
    }
    return ok
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

/**
 * JSON del cuerpo, o null si no es JSON, trae otro Content-Type o supera `maxBytes`. Lee en streaming y aborta al pasar
 * el límite (cuenta bytes): un cuerpo enorme o sin Content-Length no se carga entero en memoria.
 */
export async function readBoundedJson(request: Request, maxBytes: number): Promise<unknown | null> {
  if (!(request.headers.get("content-type") ?? "").startsWith("application/json")) return null
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes) return null
  const reader = request.body?.getReader()
  if (!reader) return null
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maxBytes) {
        await reader.cancel().catch(() => {})
        return null
      }
      chunks.push(value)
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"))
  } catch {
    return null
  }
}
