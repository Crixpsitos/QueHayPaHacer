/** De dónde llegó una visita. Lista cerrada: nada de texto libre como clave en Firestore (cardinalidad acotada). */
export const SOURCES = ["instagram", "facebook", "tiktok", "whatsapp", "x", "google", "direct", "other"] as const
export type Source = (typeof SOURCES)[number]
/** Canales de los enlaces automáticos de cada ficha (`/r/e|s/<id>/<canal>`): Instagram bio, Instagram historias, WhatsApp, Facebook, X, TikTok, afiche QR. */
export const CHANNELS = ["ig", "ig_h", "wa", "wc", "fb", "x", "tt", "qr"] as const
export type Channel = (typeof CHANNELS)[number]
export const isChannel = (v: unknown): v is Channel => typeof v === "string" && (CHANNELS as readonly string[]).includes(v)

export type TrafficSource = Source | `link:${string}` | `ch:${Channel}`

/** Clave que se guarda en `bySource`: `link:<código>` cuenta bajo `link` (T10 la afina por enlace); el resto, tal cual. */
export const sourceKey = (s: TrafficSource): Source | "link" | `ch_${Channel}` =>
  s.startsWith("link:") ? "link" : s.startsWith("ch:") ? (`ch_${s.slice(3)}` as `ch_${Channel}`) : (s as Source)

const ALIASES: Record<string, Source> = { instagram: "instagram", ig: "instagram", facebook: "facebook", fb: "facebook", tiktok: "tiktok", whatsapp: "whatsapp", wa: "whatsapp", x: "x", twitter: "x", google: "google" }
const HOSTS: Array<[Source, string]> = [["instagram", "instagram.com"], ["facebook", "facebook.com"], ["facebook", "fb.com"], ["tiktok", "tiktok.com"], ["whatsapp", "whatsapp.com"], ["whatsapp", "wa.me"], ["x", "x.com"], ["x", "t.co"], ["x", "twitter.com"], ["google", "google.com"]]
const OWN_HOST = "yquehaypahacer.com"
const CODE = /^[A-Za-z0-9]{7}$/

const isHostOrSub = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`)

/** Prioridad: enlace de campaña (`qr`) > enlace automático (`ch`) > `utm_source` > referrer > direct. Puro: sin DOM. */
export function trafficSource(i: { utm_source?: string; ref?: string; qr?: string; ch?: string }): TrafficSource {
  if (i.qr && CODE.test(i.qr)) return `link:${i.qr}`
  if (isChannel(i.ch)) return `ch:${i.ch}`
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
