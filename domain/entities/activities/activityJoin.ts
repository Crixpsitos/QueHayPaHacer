import type { ActivitySchedule } from "./value-objects/ActivitySchedule"
import { bogotaDateIso, nextOccurrence, occursOn } from "./value-objects/occurrences"

/** Ajustes de "Unirme" de una actividad. `null` en la actividad = no recibe inscripciones. */
export interface JoinSettings {
  /** Máximo de personas por salida; null = sin tope. */
  capacity: number | null
  /** Cierre manual del creador. */
  closed: boolean
  /** Cómo se paga fuera de QHPA (se muestra al reservar). Solo tiene sentido si la actividad cuesta. */
  payInstructions?: string
}

export const JOIN_CAPACITY_MAX = 500
/** Cuánto hacia adelante se puede inscribir una persona (días). */
export const JOIN_HORIZON_DAYS = 120

/** Una inscripción por persona y por salida: `{actividad}_{salida}_{uid}`. */
export const joinDocId = (activityId: string, key: string, uid: string) => `${activityId}_${key}_${uid}`

export type OccurrenceKeyResult = { ok: true; key: string } | { ok: false; error: string }

const isDated = (s: ActivitySchedule) => s.rules.some((r) => r.kind !== "always" && r.kind !== "byAppointment")
const ISO = /^\d{4}-\d{2}-\d{2}$/

/**
 * ¿A qué salida corresponde la inscripción? Con fechas: la pedida (debe ser una salida real, de hoy en adelante y
 * dentro del horizonte) o, si no se pide, la próxima. Sin fecha fija ("todos los días", "con cita"): una sola, "open".
 */
export function resolveOccurrenceKey(schedule: ActivitySchedule, requested: string | null, now: Date): OccurrenceKeyResult {
  if (!isDated(schedule)) return { ok: true, key: "open" }
  const next = nextOccurrence(schedule, now, JOIN_HORIZON_DAYS)
  if (!next) return { ok: false, error: "Esta actividad no tiene salidas próximas." }
  if (!requested) return { ok: true, key: next.date }
  if (!ISO.test(requested) || requested < bogotaDateIso(now) || !occursOn(schedule, requested)) return { ok: false, error: "Esa fecha no es una salida de la actividad." }
  if (requested > bogotaDateIso(new Date(now.getTime() + JOIN_HORIZON_DAYS * 86_400_000))) return { ok: false, error: "Esa salida está muy lejos todavía." }
  // Hoy solo cuenta si la salida de hoy no ha terminado: nextOccurrence ya descarta las terminadas.
  if (requested === bogotaDateIso(now) && next.date !== requested) return { ok: false, error: "Esa salida ya terminó." }
  return { ok: true, key: requested }
}

export type JoinDecision = { ok: true } | { ok: false; reason: "closed" | "full" }

/** ¿Hay lugar? `taken` = inscritos vigentes en esa salida. */
export function joinDecision(settings: JoinSettings, taken: number): JoinDecision {
  if (settings.closed) return { ok: false, reason: "closed" }
  if (settings.capacity !== null && taken >= settings.capacity) return { ok: false, reason: "full" }
  return { ok: true }
}

export function spotsLeft(settings: JoinSettings, taken: number): number | null {
  return settings.capacity === null ? null : Math.max(0, settings.capacity - taken)
}

/** pending = reservó y falta pagar; confirmed = pago confirmado (o actividad gratis); noShow = no pagó (libera el cupo). */
export type JoinStatusValue = "pending" | "confirmed" | "noShow"
export const holdsSpot = (s: JoinStatusValue) => s !== "noShow"
export const initialJoinStatus = (paid: boolean): JoinStatusValue => (paid ? "pending" : "confirmed")

/** De pago = todas las opciones cuestan: con una opción gratis no se pide el teléfono (minimiza el dato personal). */
export const isPaidActivity = (opts: { amountCop: number }[]) => opts.length > 0 && opts.every((o) => o.amountCop > 0)

/** Móvil colombiano → 10 dígitos (acepta +57, espacios y guiones). null si no es válido. */
export function normalizePhoneCo(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  let d = raw.replace(/[\s().-]/g, "")
  if (d.startsWith("+")) d = d.slice(1)
  if (!/^\d+$/.test(d)) return null
  if (d.length === 12 && d.startsWith("57")) d = d.slice(2)
  return /^3\d{9}$/.test(d) ? d : null
}

export const PAY_INSTRUCTIONS_MAX = 200
export function validatePayInstructions(v: unknown): string | null {
  if (typeof v !== "string") return "Cómo se paga debe ser texto."
  if (v.length > PAY_INSTRUCTIONS_MAX || /[\r\n]/.test(v)) return `Cómo se paga: una línea de máximo ${PAY_INSTRUCTIONS_MAX} caracteres.`
  return null
}
