import type { Activity } from "./Activity"

/** Lo que importa del sitio vinculado para decidir si su actividad es pública. */
export interface LinkedSite {
  published: boolean
  active: boolean
}

/**
 * Pública ⇔ publicada ∧ aprobada ∧ activa ∧ (global, o su sitio sigue publicado y activo).
 * Todo lo demás no existe para el público (404, fuera de listados, búsqueda y sitemap).
 */
export function isPubliclyVisible(a: Pick<Activity, "kind" | "publicationStatus" | "moderationStatus" | "isActive">, site?: LinkedSite | null): boolean {
  if (a.publicationStatus !== "published" || a.moderationStatus !== "approved" || !a.isActive) return false
  return a.kind === "global" || Boolean(site && site.published && site.active)
}
