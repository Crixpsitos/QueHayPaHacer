import { randomBytes } from "node:crypto"

/** A qué ficha lleva un enlace de campaña. Nunca una URL libre: el destino es SIEMPRE una ficha propia (sin redirección abierta). */
export const LINK_TARGET_TYPES = ["event", "site"] as const
export type LinkTargetType = (typeof LINK_TARGET_TYPES)[number]
export interface LinkTarget { type: LinkTargetType; id: string }

export const isLinkTargetType = (v: unknown): v is LinkTargetType => LINK_TARGET_TYPES.includes(v as LinkTargetType)

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
const CODE = /^[A-Za-z0-9]{7}$/
export const isLinkCode = (v: unknown): v is string => typeof v === "string" && CODE.test(v)

/** Código base62 de 7 caracteres con `crypto`. Descarta bytes ≥ 248 (62·4) para que cada carácter sea equiprobable. */
export function generateLinkCode(random: (n: number) => Uint8Array = randomBytes): string {
  let out = ""
  while (out.length < 7) for (const b of random(16)) if (b < 248 && out.length < 7) out += ALPHABET[b % 62]
  return out
}

/**
 * Ruta relativa de la ficha con la marca de campaña (`qr` = código: el cliente de medición lo lee y cuenta la vista con
 * `src = link:<código>`). null si el destino o el código no son válidos. Solo lleva el id codificado: nada del petición.
 */
export function landingPath(target: LinkTarget, code: string): string | null {
  if (!isLinkTargetType(target.type) || !target.id || !isLinkCode(code)) return null
  const base = target.type === "event" ? "/eventos" : "/donde-ir"
  return `${base}/${encodeURIComponent(target.id)}?utm_source=qhpa_link&utm_medium=short_link&utm_campaign=${code}&qr=${code}`
}
