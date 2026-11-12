import type { ReviewStatus } from "../review/ActivityReview"

export const FLAG_REASONS = ["not_attended", "false_info", "offensive", "personal_data", "spam", "conflict_of_interest", "other"] as const
export type FlagReason = (typeof FLAG_REASONS)[number]
export const FLAG_NOTE_MIN = 20
export const FLAG_NOTE_MAX = 300
export const MAX_OPEN_FLAGS_PER_ACCOUNT = 5
export const MAX_OPEN_FLAGS_PER_ACTIVITY = 3
export const PREVENTIVE_HIDE_REPORTS = 3
const DAY = 86_400_000

export type SanctionRole = "reviewer" | "host"
export type SanctionKind = "warning" | "restriction" | "suspension"
export interface Sanction { uid: string; role: SanctionRole; kind: SanctionKind; reason: string; activityId: string; reviewId?: string; createdAt: Date; expiresAt: Date; createdBy: string }

/** Sanciones sin vencer de una cuenta (alimentan `isTrustedHost`). */
export const activeSanctions = (list: readonly Sanction[], uid: string, now: Date) => list.filter((s) => s.uid === uid && s.expiresAt.getTime() > now.getTime()).length
/** ¿Tiene una restricción o suspensión vigente en ese rol? (reseñador: no reseña; anfitrión: pierde «cuestionar»). */
export const isRestricted = (list: readonly Sanction[], uid: string, role: SanctionRole, now: Date) =>
  list.some((s) => s.uid === uid && s.role === role && s.kind !== "warning" && s.expiresAt.getTime() > now.getTime())

export interface FlagContext { uid: string; isHost: boolean; openByAccount: number; openOnActivity: number; alreadyFlaggedThis: boolean; reviewStatus: ReviewStatus; sanctions: readonly Sanction[] }

/** Mensaje de error o null. Solo quien organiza (o el dueño del sitio) cuestiona; el resto usa «Reportar». */
export function canFlag(c: FlagContext, input: { reason: FlagReason; note: string }, now: Date): string | null {
  if (!c.isHost) return "Solo quien organiza la actividad puede cuestionar. Si algo te preocupa, usa «Reportar»."
  if (!FLAG_REASONS.includes(input.reason)) return "Elige un motivo de la lista."
  const n = input.note.trim().length
  if (n < FLAG_NOTE_MIN || n > FLAG_NOTE_MAX) return `Cuéntanos el motivo en ${FLAG_NOTE_MIN} a ${FLAG_NOTE_MAX} caracteres.`
  if (isRestricted(c.sanctions, c.uid, "host", now)) return "Por ahora no puedes cuestionar reseñas."
  if (c.reviewStatus !== "published") return "Esta reseña ya está en revisión o fue retirada."
  if (c.alreadyFlaggedThis) return "Esa reseña ya fue cuestionada una vez."
  if (c.openByAccount >= MAX_OPEN_FLAGS_PER_ACCOUNT) return "Tienes demasiadas reseñas en verificación. Espera a que QHPA resuelva alguna."
  if (c.openOnActivity >= MAX_OPEN_FLAGS_PER_ACTIVITY) return "Esta actividad ya tiene varias reseñas en verificación."
  return null
}

/** Escalera por defecto (los números viven aquí, en un solo lugar; cambiarlos requiere OK del dueño). */
export function nextSanction(role: SanctionRole, prior12m: number, _now: Date): { kind: SanctionKind; days: number; manual: boolean } {
  if (prior12m <= 0) return { kind: "warning", days: 365, manual: false }
  if (prior12m === 1) return { kind: "restriction", days: role === "reviewer" ? 30 : 90, manual: false }
  return { kind: "suspension", days: 365, manual: true }
}

export interface ResolveEffects {
  reviewStatus: "published" | "removed"
  verified: boolean
  removeFromRating: boolean
  sanction: { role: SanctionRole; kind: SanctionKind; days: number; manual: boolean } | null
  notify: ("host" | "reviewer")[]
}

/** Efectos de resolver un cuestionamiento. `upheld` = la reseña es real; `removed` = es falsa. */
export function resolveFlag(outcome: "upheld" | "removed", ctx: { abusive: boolean; priorHost: number; priorReviewer: number }, now: Date): ResolveEffects {
  if (outcome === "upheld") {
    return { reviewStatus: "published", verified: true, removeFromRating: false, sanction: ctx.abusive ? { role: "host", ...nextSanction("host", ctx.priorHost, now) } : null, notify: ["host", "reviewer"] }
  }
  return { reviewStatus: "removed", verified: false, removeFromRating: true, sanction: { role: "reviewer", ...nextSanction("reviewer", ctx.priorReviewer, now) }, notify: ["host", "reviewer"] }
}

/** Ocultado preventivo: 3 reportes de personas distintas en 24 horas. */
export function shouldHidePreventively(reports: readonly { by: string; at: Date }[], now: Date): boolean {
  const recent = reports.filter((r) => now.getTime() - r.at.getTime() <= DAY && r.at.getTime() <= now.getTime())
  return new Set(recent.map((r) => r.by)).size >= PREVENTIVE_HIDE_REPORTS
}

export const sanctionExpiry = (now: Date, days: number) => new Date(now.getTime() + days * DAY)
