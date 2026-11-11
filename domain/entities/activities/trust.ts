import type { Activity } from "./Activity"

/** Cuántas actividades aprobadas hacen de una cuenta una "cuenta de confianza" (se autoaprueba). Un solo lugar para ajustarlo. */
export const TRUST_MIN_APPROVED = 3

export interface AccountHistory {
  approvedCount: number
  /** Sanciones vigentes (advertencia, restricción o suspensión sin vencer). */
  activeSanctions: number
  /** ms epoch hasta cuando está suspendida, o null. */
  suspendedUntil: number | null
}

export function isTrustedHost(h: AccountHistory, now: number): boolean {
  if (h.suspendedUntil !== null && h.suspendedUntil > now) return false
  return h.approvedCount >= TRUST_MIN_APPROVED && h.activeSanctions === 0
}

const mediaKey = (m: Activity["media"][number]) => `${m.type}:${m.id}`

/**
 * Una cuenta sin confianza que cambia título, descripción o fotos/video de una actividad ya aprobada
 * la manda otra vez a revisión (D23). Horario, precio, botón y secciones no reabren revisión.
 */
export function needsReReview(prev: Pick<Activity, "title" | "description" | "media">, next: Pick<Activity, "title" | "description" | "media">, trusted: boolean): boolean {
  if (trusted) return false
  return prev.title.trim() !== next.title.trim() || prev.description.trim() !== next.description.trim() || prev.media.map(mediaKey).join("|") !== next.media.map(mediaKey).join("|")
}
