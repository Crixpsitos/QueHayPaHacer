/** Canales de "Compartir" que se marcan en el enlace (copiar enlace no: ese enlace se pega en cualquier parte). */
const CHANNELS = ["whatsapp", "facebook", "x"] as const

/** Agrega `utm_source=<canal>&utm_medium=share` al enlace que se comparte, para saber de qué botón vino la visita. */
export function shareUrl(url: string, channel: string): string {
  if (!CHANNELS.includes(channel as (typeof CHANNELS)[number])) return url
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return url
  }
  u.searchParams.set("utm_source", channel)
  u.searchParams.set("utm_medium", "share")
  return u.toString()
}
