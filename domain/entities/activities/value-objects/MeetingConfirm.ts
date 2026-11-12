/** Cuando el punto de encuentro cambia cada vez: dónde se confirma (grupo o perfil) y su enlace. */
export const CONFIRM_CHANNELS = ["whatsapp", "instagram", "telegram", "other"] as const
export type ConfirmChannel = (typeof CONFIRM_CHANNELS)[number]
export const CONFIRM_LABELS: Record<ConfirmChannel, string> = { whatsapp: "WhatsApp", instagram: "Instagram", telegram: "Telegram", other: "Otro enlace" }
export const CONFIRM_URL_MAX = 300

export interface MeetingConfirm { channel: ConfirmChannel; url: string }

const HOSTS: Record<Exclude<ConfirmChannel, "other">, RegExp> = {
  whatsapp: /^(chat\.whatsapp\.com|wa\.me|api\.whatsapp\.com|whatsapp\.com)$/,
  instagram: /^(www\.)?(instagram\.com|ig\.me)$/,
  telegram: /^(t\.me|telegram\.me|telegram\.dog)$/,
}

/** Limpia el enlace (https, sin credenciales) y comprueba que sea del canal elegido. «Otro» acepta cualquier https. */
export function normalizeConfirm(input: { channel: unknown; url: unknown }): { ok: true; confirm: MeetingConfirm } | { ok: false; error: string } {
  const channel = (CONFIRM_CHANNELS as readonly string[]).includes(input.channel as string) ? (input.channel as ConfirmChannel) : null
  if (!channel) return { ok: false, error: "Elige por dónde se confirma el punto de encuentro." }
  const raw = typeof input.url === "string" ? input.url.trim() : ""
  if (!raw) return { ok: false, error: "Pega el enlace del grupo o perfil donde se confirma." }
  if (raw.length > CONFIRM_URL_MAX) return { ok: false, error: "El enlace es demasiado largo." }
  let u: URL
  try { u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`) } catch { return { ok: false, error: "Ese enlace no es válido." } }
  if (u.protocol !== "https:" || u.username || u.password) return { ok: false, error: "El enlace debe empezar por https://." }
  if (channel !== "other" && !HOSTS[channel].test(u.hostname.toLowerCase())) return { ok: false, error: `Ese enlace no es de ${CONFIRM_LABELS[channel]}.` }
  return { ok: true, confirm: { channel, url: u.toString() } }
}
