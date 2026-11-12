/** Enlace del Canal de WhatsApp de QHPA. Vive en `appConfig/whatsapp-channel` (campo `url`): se cambia sin desplegar. */
export const CHANNEL_CONFIG_KEY = "whatsapp-channel"

/** Solo se aceptan enlaces https de canales de WhatsApp; cualquier otra cosa se ignora (el botón no se muestra). */
export function parseChannelUrl(v: unknown): string | null {
  if (typeof v !== "string") return null
  const t = v.trim()
  return /^https:\/\/(www\.)?whatsapp\.com\/channel\/[A-Za-z0-9_-]{4,64}$/.test(t) ? t : null
}

/** Para los enlaces de QHPA que se publican en el Canal: la visita se atribuye al canal «wc». */
export const withChannelAttribution = (url: string): string => `${url}?ch=wc&utm_source=whatsapp&utm_medium=channel&utm_campaign=auto`
