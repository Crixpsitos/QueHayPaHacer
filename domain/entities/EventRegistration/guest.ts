import { isValidCheckInCode, normalizeCheckInCode } from "./checkIn"

/** Personas sin cuenta que quien organiza agrega a mano (inscripción por WhatsApp, en la puerta…). Su id lleva este prefijo. */
export const GUEST_PREFIX = "guest_"
export const GUEST_MAX_PER_EVENT = 300
export const isGuestId = (id: string) => id.startsWith(GUEST_PREFIX)

export interface GuestInput { name: string; phone?: string | null; email?: string | null }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Limpia y valida lo que escribe quien organiza. El WhatsApp y el correo son opcionales (WhatsApp: 10 dígitos de Colombia, empieza por 3). */
export function cleanGuest(i: GuestInput): { ok: true; name: string; phone: string | null; email: string | null } | { ok: false; error: string } {
  const name = (i.name ?? "").replace(/\s+/g, " ").trim().slice(0, 80)
  if (name.length < 2) return { ok: false, error: "Escribe el nombre de la persona." }
  const digits = (i.phone ?? "").replace(/\D/g, "").replace(/^57(?=3\d{9}$)/, "")
  if (digits && !/^3\d{9}$/.test(digits)) return { ok: false, error: "El WhatsApp debe tener 10 dígitos y empezar por 3." }
  const email = (i.email ?? "").trim().toLowerCase().slice(0, 120)
  if (email && !EMAIL_RE.test(email)) return { ok: false, error: "El correo no parece válido." }
  return { ok: true, name, phone: digits || null, email: email || null }
}

/** Código de la entrada desde la URL (acepta minúsculas y guiones). null si no es un código válido. */
export function entryCode(raw: string): string | null {
  const c = normalizeCheckInCode(raw)
  return isValidCheckInCode(c) ? c : null
}

export const entryPath = (eventId: string, code: string) => `/entrada/${eventId}/${code}`

/** Mensaje de WhatsApp con la entrada (con el nombre de pila de la persona). */
export function entryMessage(i: { name: string; eventTitle: string; url: string }): string {
  return `Hola ${i.name.split(" ")[0]}, quedaste inscrito en «${i.eventTitle}». Esta es tu entrada con el código QR para mostrar al llegar: ${i.url}`
}
