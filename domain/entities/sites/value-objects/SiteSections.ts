/**
 * Secciones desplegables de la ficha ("Cómo llegar", "Qué incluye", "Fuentes"…): título + texto plano.
 * Opcionales; la `description` queda como pitch corto y el dato de consulta vive aquí.
 */
export interface SiteSection {
  title: string
  body: string
}

export const SECTIONS_MAX = 12
export const SECTION_TITLE_MAX = 60
export const SECTION_BODY_MAX = 3000
export const SECTIONS_TOTAL_MAX = 8000

/** Limpia lo que viene de Firestore o del cliente. Nunca lanza; descarta incompletas y lo que excede el total. */
export function normalizeSections(raw: unknown): SiteSection[] {
  if (!Array.isArray(raw)) return []
  const out: SiteSection[] = []
  let total = 0
  for (const item of raw) {
    if (out.length >= SECTIONS_MAX) break
    const r = (item && typeof item === "object" ? item : {}) as Record<string, unknown>
    if (typeof r.title !== "string" || typeof r.body !== "string") continue
    const title = r.title.trim().slice(0, SECTION_TITLE_MAX).trim()
    const body = r.body.trim().slice(0, SECTION_BODY_MAX).trim()
    if (!title || !body) continue
    if (total + title.length + body.length > SECTIONS_TOTAL_MAX) continue
    total += title.length + body.length
    out.push({ title, body })
  }
  return out
}
