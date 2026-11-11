/**
 * Botón de acción de una actividad: cómo unirse, preguntar, comprar o reservar (spec 5.6).
 * Solo enlaces https o teléfono colombiano normalizado. "checkout" (pago dentro de QHPA) queda reservado
 * para `activity-commerce` y hoy se rechaza.
 */
export const CTA_KINDS = ["whatsapp", "whatsappGroup", "website", "instagram", "phone", "reserveLink", "buyLink"] as const
export type CtaKind = (typeof CTA_KINDS)[number]

export interface Cta {
  kind: CtaKind
  /** Ya normalizado: URL https, "https://wa.me/57…" o "+57…". */
  value: string
  label?: string
}

export const CTA_VALUE_MAX = 300
export const CTA_LABEL_MAX = 30

export type CtaResult = { ok: true; cta: Cta } | { ok: false; error: string }
const fail = (error: string): CtaResult => ({ ok: false, error })

/** Quita +57/57, espacios y guiones. Devuelve 10 dígitos o null. */
export function colombianNumber(raw: string): string | null {
  const digits = raw.replace(/[\s\-().]/g, "").replace(/^\+/, "")
  if (!/^\d+$/.test(digits)) return null
  const local = digits.length === 12 && digits.startsWith("57") ? digits.slice(2) : digits
  return local.length === 10 ? local : null
}

/** https sin credenciales ni IP ni hosts sin punto. */
function safeHttps(raw: string): URL | null {
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return null
  }
  if (u.protocol !== "https:" || u.username || u.password) return null
  const h = u.hostname
  if (!h.includes(".") || h === "localhost" || /^[\d.]+$/.test(h) || h.includes(":")) return null
  return u
}

export function normalizeCta(input: { kind: unknown; value: unknown; label?: unknown }): CtaResult {
  const { kind, value } = input
  if (kind === "checkout") return fail("Este tipo de botón aún no está disponible.")
  if (typeof kind !== "string" || !(CTA_KINDS as readonly string[]).includes(kind)) return fail("Tipo de botón inválido.")
  if (typeof value !== "string" || !value.trim() || value.length > CTA_VALUE_MAX) return fail(`El valor es obligatorio y admite máximo ${CTA_VALUE_MAX} caracteres.`)
  const label = typeof input.label === "string" ? input.label.trim() : undefined
  if (label !== undefined && label.length > CTA_LABEL_MAX) return fail(`El texto del botón admite máximo ${CTA_LABEL_MAX} caracteres.`)
  const withLabel = (k: CtaKind, v: string): CtaResult => ({ ok: true, cta: { kind: k, value: v, ...(label ? { label } : {}) } })
  const v = value.trim()
  const k = kind as CtaKind

  if (k === "whatsapp" || k === "phone") {
    const n = colombianNumber(v)
    if (!n || (k === "whatsapp" && !n.startsWith("3"))) return fail(k === "whatsapp" ? "Escribe un celular colombiano de 10 dígitos (empieza por 3)." : "Escribe un teléfono colombiano de 10 dígitos.")
    return withLabel(k, k === "whatsapp" ? `https://wa.me/57${n}` : `+57${n}`)
  }
  const u = safeHttps(v)
  if (!u) return fail("Escribe un enlace seguro que empiece por https://")
  if (k === "whatsappGroup" && (u.hostname !== "chat.whatsapp.com" || u.pathname.length < 2)) return fail("El enlace debe ser de un grupo de WhatsApp (chat.whatsapp.com/…).")
  if (k === "instagram" && !(u.hostname === "instagram.com" || u.hostname.endsWith(".instagram.com"))) return fail("El enlace debe ser de instagram.com.")
  return withLabel(k, u.toString())
}
