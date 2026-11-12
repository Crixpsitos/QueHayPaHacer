export interface LatLng { lat: number; lng: number }

/** Colombia y alrededores: descarta pares de números que no son una ubicación nuestra (p. ej. un zoom o un id). */
const inRange = (lat: number, lng: number) => lat >= -5 && lat <= 14 && lng >= -82 && lng <= -66

const PATTERNS = [
  /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/,                    // .../place/X/@4.44,-75.20,17z
  /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/,                // ...!3d4.44!4d-75.20 (punto exacto del lugar)
  /[?&](?:q|ll|query|center|destination)=(-?\d{1,2}\.\d+)(?:,|%2C)\s*(-?\d{1,3}\.\d+)/i, // ?q=4.44,-75.20
  /^\s*(-?\d{1,2}\.\d+)\s*[,;]\s*(-?\d{1,3}\.\d+)\s*$/,    // «4.44, -75.20» pegado tal cual
]

/** Coordenadas dentro de un enlace de Google Maps (ya expandido) o de un par «lat, lng». null si no hay o están fuera de rango. */
export function parseMapsCoords(text: string): LatLng | null {
  const t = (() => { try { return decodeURIComponent(text) } catch { return text } })()
  // «!3d!4d» es el punto del lugar; «@» es el centro de la vista: gana el primero si ambos vienen
  for (const re of [PATTERNS[1], PATTERNS[0], PATTERNS[2], PATTERNS[3]]) {
    const m = t.match(re)
    if (m && inRange(Number(m[1]), Number(m[2]))) return { lat: Number(m[1]), lng: Number(m[2]) }
  }
  return null
}

const HOSTS = [/^maps\.app\.goo\.gl$/, /^goo\.gl$/, /^(www\.)?google\.(com|com\.co|co)$/, /^maps\.google\.(com|com\.co|co)$/]
/** Solo se siguen enlaces de Google (los cortos se expanden en el servidor): nada más. */
export const isGoogleMapsHost = (host: string) => HOSTS.some((r) => r.test(host.toLowerCase()))
