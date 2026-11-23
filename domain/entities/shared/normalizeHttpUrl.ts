/**
 * Enlace externo escrito por una persona: acepta «ejemplo.com/registro» o «https://…» y devuelve el href http(s)
 * completo, o null si no es un enlace válido. Bloquea `javascript:`, `data:`, `mailto:`, etc. (se renderizan como href).
 */
export function normalizeHttpUrl(raw: string): string | null {
  const text = (raw ?? "").trim()
  if (!text || /\s/.test(text) || text.startsWith("/")) return null // vacío, con espacios o «//dominio» (relativo al protocolo)
  const hasHttp = /^https?:\/\//i.test(text)
  // Otro esquema (javascript:, data:, mailto:…); «ejemplo.com:8080» no cuenta (el esquema no lleva número detrás).
  if (!hasHttp && /^[a-z][a-z0-9+.-]*:(?!\d)/i.test(text)) return null
  try {
    const url = new URL(hasHttp ? text : `https://${text}`)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    if (url.username || url.password) return null
    if (!url.hostname.includes(".") || url.hostname.startsWith(".") || url.hostname.endsWith(".")) return null
    return url.href
  } catch {
    return null
  }
}

/** Para esquemas valibot: devuelve el href normalizado o, si no es válido, el texto original (la validación posterior lo rechaza). */
export const normalizeHttpUrlOrKeep = (raw: string): string => (raw.trim() === "" ? raw : normalizeHttpUrl(raw) ?? raw)
