import { isChannel, type Channel } from "@/domain/entities/analytics/trafficSource"

/** Enlaces automáticos de cada ficha: uno por canal, sin crear nada. Orden = el de la pantalla. */
export const AUTO_CHANNELS: readonly { id: Channel; label: string }[] = [
  { id: "ig", label: "Instagram (bio)" },
  { id: "ig_h", label: "Instagram (historias)" },
  { id: "wa", label: "WhatsApp" },
  { id: "wc", label: "Canal de WhatsApp" },
  { id: "fb", label: "Facebook" },
  { id: "qr", label: "Afiche con QR" },
]

// utm que acompaña a cada canal (Google Analytics lo lee: fuente y medio).
const UTM: Record<Channel, [source: string, medium: string]> = {
  ig: ["instagram", "bio"], ig_h: ["instagram", "stories"], wa: ["whatsapp", "share"], wc: ["whatsapp", "channel"], em: ["email", "auto"], fb: ["facebook", "share"],
  x: ["x", "share"], tt: ["tiktok", "bio"], qr: ["qr", "print"],
}

type Kind = "event" | "site" | "activity"
const SHORT: Record<Kind, string> = { event: "e", site: "s", activity: "a" }
const BASE: Record<Kind, string> = { event: "/eventos", site: "/donde-ir", activity: "/actividades" }

/** Ruta corta que se comparte: `/r/e/<id>/<canal>` (evento) o `/r/s/<id>/<canal>` (sitio). */
export const autoLinkHref = (kind: Kind, id: string, channel: Channel) =>
  `/r/${SHORT[kind]}/${encodeURIComponent(id)}/${channel}`

/** A dónde redirige (en actividades `id` es el slug): la ficha pública con `ch` (la medición lo lee) y utm. null si el tipo, el id o el canal no son válidos. */
export function autoLandingPath(kind: Kind, id: string, channel: string): string | null {
  if (!(kind in SHORT) || !id || !isChannel(channel)) return null
  const [source, medium] = UTM[channel]
  return `${BASE[kind]}/${encodeURIComponent(id)}?ch=${channel}&utm_source=${source}&utm_medium=${medium}&utm_campaign=auto`
}
