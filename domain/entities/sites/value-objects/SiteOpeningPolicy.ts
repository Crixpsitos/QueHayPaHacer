/**
 * Cómo se comporta un sitio fuera de su horario semanal normal. Todo es opcional: un sitio sin dato queda
 * "sin confirmar" (nunca se asume que abre ni que cierra).
 */
export const HOLIDAY_POLICIES = ["same", "custom", "closed"] as const
export type HolidayPolicy = (typeof HOLIDAY_POLICIES)[number]

export const RAIN_POLICIES = ["open", "partial", "closed"] as const
export type RainPolicy = (typeof RAIN_POLICIES)[number]

export const HOLIDAY_POLICY_LABELS: Record<HolidayPolicy, string> = {
  same: "Abre con su horario normal",
  custom: "Abre con otro horario",
  closed: "Cierra los festivos",
}

export const RAIN_POLICY_LABELS: Record<RainPolicy, string> = {
  open: "Abre normal",
  partial: "Abre parcialmente",
  closed: "Cierra",
}

export const RAIN_NOTE_MAX = 120

export interface SiteOpeningPolicy {
  /** `open`/`close` ("HH:MM") solo existen con `policy: "custom"`. */
  holidays?: { policy: HolidayPolicy; open?: string; close?: string }
  rain?: { policy: RainPolicy; note?: string }
}

const TIME = /^\d{2}:\d{2}$/

/**
 * Limpia lo que viene de Firestore o del cliente: descarta valores desconocidos y campos que no aplican
 * (p. ej. horas de festivo si la política no es "custom"). Nunca lanza.
 */
export function normalizeOpeningPolicy(raw: unknown): SiteOpeningPolicy {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  const out: SiteOpeningPolicy = {}

  const h = (r.holidays && typeof r.holidays === "object" ? r.holidays : {}) as Record<string, unknown>
  if ((HOLIDAY_POLICIES as readonly unknown[]).includes(h.policy)) {
    const policy = h.policy as HolidayPolicy
    if (policy === "custom") {
      if (typeof h.open === "string" && typeof h.close === "string" && TIME.test(h.open) && TIME.test(h.close)) {
        out.holidays = { policy, open: h.open, close: h.close }
      } // "custom" sin horas válidas no se puede interpretar → queda sin confirmar
    } else {
      out.holidays = { policy }
    }
  }

  const w = (r.rain && typeof r.rain === "object" ? r.rain : {}) as Record<string, unknown>
  if ((RAIN_POLICIES as readonly unknown[]).includes(w.policy)) {
    const note = typeof w.note === "string" ? w.note.trim().slice(0, RAIN_NOTE_MAX) : ""
    out.rain = { policy: w.policy as RainPolicy, ...(note ? { note } : {}) }
  }
  return out
}
