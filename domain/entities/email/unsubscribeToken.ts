import { createHmac, timingSafeEqual } from "node:crypto"

/** Firma de la baja con un clic: HMAC del uid con un secreto del servidor. Sin secreto no hay baja posible (se rechaza). SOLO servidor. */
export const unsubscribeToken = (uid: string, secret: string): string => createHmac("sha256", secret).update(`unsub:${uid}`).digest("hex").slice(0, 32)

export function verifyUnsubscribeToken(uid: string, token: unknown, secret: string | undefined): boolean {
  if (!secret || typeof token !== "string" || !uid) return false
  const a = Buffer.from(unsubscribeToken(uid, secret)), b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Enlace y cabeceras de baja (RFC 8058: un clic desde el cliente de correo). */
export function unsubscribeHeaders(siteUrl: string, uid: string, secret: string): { link: string; headers: Record<string, string> } {
  const link = `${siteUrl}/baja?u=${encodeURIComponent(uid)}&t=${unsubscribeToken(uid, secret)}`
  return { link, headers: { "List-Unsubscribe": `<${siteUrl}/api/email/unsubscribe?u=${encodeURIComponent(uid)}&t=${unsubscribeToken(uid, secret)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } }
}
