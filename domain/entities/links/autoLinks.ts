import { isChannel, type Channel } from "@/domain/entities/analytics/trafficSource"

/** Enlaces automáticos de cada ficha: uno por canal, sin crear nada. Orden = el de la pantalla. */
export const AUTO_CHANNELS: readonly { id: Channel; label: string }[] = [
  { id: "ig", label: "Instagram (bio)" },
  { id: "ig_h", label: "Instagram (historias)" },
  { id: "wa", label: "WhatsApp" },
  { id: "fb", label: "Facebook" },
  { id: "qr", label: "Afiche con QR" },
]

// utm que acompaña a cada canal (Google Analytics lo lee: fuente y medio).
const UTM: Record<Channel, [source: string, medium: string]> = {
  ig: ["instagram", "bio"], ig_h: ["instagram", "stories"], wa: ["whatsapp", "share"], fb: ["facebook", "share"],
  x: ["x", "share"], tt: ["tiktok", "bio"], qr: ["qr", "print"],
}

type Kind = "event" | "site"

/** Ruta corta que se comparte: `/r/e/<id>/<canal>` (evento) o `/r/s/<id>/<canal>` (sitio). */
export const autoLinkHref = (kind: Kind, id: string, channel: Channel) =>
  `/r/${kind === "event" ? "e" : "s"}/${encodeURIComponent(id)}/${channel}`

/** A dónde redirige: la ficha pública con `ch` (la medición lo lee) y utm. null si el tipo, el id o el canal no son válidos. */
export function autoLandingPath(kind: Kind, id: string, channel: string): string | null {
  if ((kind !== "event" && kind !== "site") || !id || !isChannel(channel)) return null
  const [source, medium] = UTM[channel]
  const base = kind === "event" ? "/eventos" : "/donde-ir"
  return `${base}/${encodeURIComponent(id)}?ch=${channel}&utm_source=${source}&utm_medium=${medium}&utm_campaign=auto`
}
