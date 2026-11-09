/** De dónde llegó una visita. Lista cerrada: nada de texto libre como clave en Firestore (cardinalidad acotada). */
export const SOURCES = ["instagram", "facebook", "tiktok", "whatsapp", "x", "google", "direct", "other"] as const
export type Source = (typeof SOURCES)[number]
export type TrafficSource = Source | `link:${string}`

/** Clave que se guarda en `bySource`: `link:<código>` cuenta bajo `link` (T10 la afina por enlace); el resto, tal cual. */
export const sourceKey = (s: TrafficSource): Source | "link" => (s.startsWith("link:") ? "link" : (s as Source))

const ALIASES: Record<string, Source> = { instagram: "instagram", ig: "instagram", facebook: "facebook", fb: "facebook", tiktok: "tiktok", whatsapp: "whatsapp", wa: "whatsapp", x: "x", twitter: "x", google: "google" }
const HOSTS: Array<[Source, string]> = [["instagram", "instagram.com"], ["facebook", "facebook.com"], ["facebook", "fb.com"], ["tiktok", "tiktok.com"], ["whatsapp", "whatsapp.com"], ["whatsapp", "wa.me"], ["x", "x.com"], ["x", "t.co"], ["x", "twitter.com"], ["google", "google.com"]]
const OWN_HOST = "yquehaypahacer.com"
const CODE = /^[A-Za-z0-9]{7}$/

const isHostOrSub = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`)

/** Prioridad: enlace de campaña (`qr`) > `utm_source` > referrer > direct. Puro: sin DOM. */
export function trafficSource(i: { utm_source?: string; ref?: string; qr?: string }): TrafficSource {
  if (i.qr && CODE.test(i.qr)) return `link:${i.qr}`
  const utm = i.utm_source?.trim().toLowerCase()
  if (utm) return ALIASES[utm] ?? "other"
  if (!i.ref) return "direct"
  let host: string
  try {
    host = new URL(i.ref).hostname.toLowerCase()
  } catch {
    return "direct"
  }
  if (isHostOrSub(host, OWN_HOST)) return "direct"
  return HOSTS.find(([, d]) => isHostOrSub(host, d))?.[0] ?? "other"
}
