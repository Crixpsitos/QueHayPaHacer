/**
 * Confianza de una cuenta para publicar con moderación POSTERIOR (se publica de una vez y QHPA audita después) en eventos,
 * sitios y actividades. Es independiente de la insignia pública «creador verificado», del plan y de la participación.
 *
 * Orden de las reglas: una restricción (manual o por suspensión) siempre gana; luego la confianza manual del admin;
 * luego ser creador verificado (comportamiento que ya existía en eventos); y por último ganársela: TRUST_APPROVED_MIN
 * publicaciones aprobadas sin ningún rechazo en los últimos TRUST_WINDOW_DAYS días.
 */
export const TRUST_APPROVED_MIN = 3
export const TRUST_WINDOW_DAYS = 90

/** Ajuste manual del admin sobre `users/{uid}.trust.level`. Sin valor = automático. */
export type TrustOverride = "trusted" | "restricted"

export interface TrustSignals {
  override?: TrustOverride
  creatorVerified: boolean
  /** Eventos + sitios + actividades suyos ya aprobados. */
  approvedCount: number
  /** Rechazados o dados de baja dentro de la ventana. */
  rejectedRecent: number
  /** Suspensión vigente de actividades. */
  suspended: boolean
}

export type TrustReason = "restricted" | "suspended" | "manual" | "verified" | "earned" | "none"
export interface TrustResult {
  /** Publica con moderación posterior. */
  trusted: boolean
  /** Fuerza moderación previa, incluso si es creador verificado. */
  restricted: boolean
  reason: TrustReason
}

export function computeTrust(s: TrustSignals): TrustResult {
  if (s.override === "restricted") return { trusted: false, restricted: true, reason: "restricted" }
  if (s.suspended) return { trusted: false, restricted: true, reason: "suspended" }
  if (s.override === "trusted") return { trusted: true, restricted: false, reason: "manual" }
  if (s.creatorVerified) return { trusted: true, restricted: false, reason: "verified" }
  if (s.approvedCount >= TRUST_APPROVED_MIN && s.rejectedRecent === 0) return { trusted: true, restricted: false, reason: "earned" }
  return { trusted: false, restricted: false, reason: "none" }
}

export const TRUST_REASON_LABEL: Record<TrustReason, string> = {
  restricted: "Restringida por QHPA",
  suspended: "Suspendida",
  manual: "De confianza (QHPA)",
  verified: "Creador verificado",
  earned: "Se la ganó (publicaciones aprobadas)",
  none: "Aún sin confianza",
}
