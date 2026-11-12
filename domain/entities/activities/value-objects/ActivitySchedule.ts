/**
 * Horario estructurado de una actividad (spec 5.4). Todo en hora de Bogotá (UTC-5, sin horario de verano):
 * las fechas son "YYYY-MM-DD" (calendario civil) y las horas "HH:mm". Weekday: 0 = domingo … 6 = sábado.
 * ponytail: `always` admite un solo rango de horas propio; el horario por día del sitio se hereda tal cual.
 */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

interface Times {
  start: string
  end?: string
}

export type ScheduleRule =
  | ({ kind: "weekly"; weekdays: Weekday[] } & Times)
  | ({ kind: "everyNWeeks"; n: number; anchorDate: string; weekdays: Weekday[] } & Times)
  | ({ kind: "monthlyNth"; nth: 1 | 2 | 3 | 4 | "last"; weekday: Weekday } & Times)
  | ({ kind: "monthlyDay"; dayOfMonth: number } & Times)
  | ({ kind: "dates"; dates: string[] } & Times)
  | { kind: "always"; start?: string; end?: string }
  | { kind: "byAppointment" }

export interface ActivitySchedule {
  rules: ScheduleRule[]
  validFrom?: string
  validUntil?: string
  /** Excepciones: días en que no hay actividad (festivos, mantenimiento). */
  skipDates: string[]
  note?: string
  requiresReservation: boolean
  /** Festivos de Colombia: `skip` = no sale ese día; `only` = solo sale en festivos. Sin valor = igual que los demás días. */
  holidays?: "skip" | "only"
}

export const SCHEDULE_RULES_MAX = 7
export const SCHEDULE_DATES_MAX = 52
export const SCHEDULE_SKIP_MAX = 60
export const SCHEDULE_NOTE_MAX = 160

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** ¿Es una fecha civil real? ("2026-02-30" no). */
export function isValidDate(s: unknown): s is string {
  if (typeof s !== "string") return false
  const m = DATE_RE.exec(s)
  if (!m) return false
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const t = new Date(Date.UTC(y, mo - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d
}

const isTime = (s: unknown): s is string => typeof s === "string" && TIME_RE.test(s)
const isWeekday = (n: unknown): n is Weekday => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 6

function timesError(start: unknown, end: unknown, startRequired: boolean): string | null {
  if (start === undefined && !startRequired) return end === undefined ? null : "La hora de fin necesita una hora de inicio."
  if (!isTime(start)) return "Hora inválida (usa HH:mm, por ejemplo 06:00)."
  if (end === undefined) return null
  if (!isTime(end)) return "Hora inválida (usa HH:mm, por ejemplo 06:00)."
  return end > start ? null : "La hora de fin debe ser posterior a la de inicio."
}

function weekdaysError(w: unknown): string | null {
  if (!Array.isArray(w) || w.length === 0) return "Elige al menos un día de la semana."
  if (!w.every(isWeekday)) return "Día de la semana inválido."
  return new Set(w).size === w.length ? null : "Hay días repetidos."
}

function ruleError(r: ScheduleRule): string | null {
  switch (r.kind) {
    case "weekly":
      return weekdaysError(r.weekdays) ?? timesError(r.start, r.end, true)
    case "everyNWeeks":
      if (!Number.isInteger(r.n) || r.n < 2 || r.n > 8) return "Cada cuántas semanas debe ser un número entre 2 y 8."
      if (!isValidDate(r.anchorDate)) return "La fecha ancla no es válida."
      return weekdaysError(r.weekdays) ?? timesError(r.start, r.end, true)
    case "monthlyNth":
      if (![1, 2, 3, 4, "last"].includes(r.nth)) return "La semana del mes debe ser 1, 2, 3, 4 o la última."
      if (!isWeekday(r.weekday)) return "Día de la semana inválido."
      return timesError(r.start, r.end, true)
    case "monthlyDay":
      if (!Number.isInteger(r.dayOfMonth) || r.dayOfMonth < 1 || r.dayOfMonth > 31) return "El día del mes debe estar entre 1 y 31."
      return timesError(r.start, r.end, true)
    case "dates":
      if (!Array.isArray(r.dates) || r.dates.length === 0) return "Agrega al menos una fecha."
      if (r.dates.length > SCHEDULE_DATES_MAX) return `Máximo ${SCHEDULE_DATES_MAX} fechas.`
      if (!r.dates.every(isValidDate)) return "Hay una fecha inválida."
      if (new Set(r.dates).size !== r.dates.length) return "Hay fechas repetidas."
      return timesError(r.start, r.end, true)
    case "always":
      return timesError(r.start, r.end, false)
    case "byAppointment":
      return null
    default:
      return "Tipo de horario desconocido."
  }
}

/** Devuelve el mensaje de error (en español) o null si el horario es válido. */
export function validateSchedule(s: ActivitySchedule): string | null {
  if (!Array.isArray(s.rules) || s.rules.length === 0) return "Agrega al menos una regla de horario."
  if (s.rules.length > SCHEDULE_RULES_MAX) return `Máximo ${SCHEDULE_RULES_MAX} reglas de horario.`
  for (const r of s.rules) {
    const e = ruleError(r)
    if (e) return e
  }
  const skip = s.skipDates ?? []
  if (skip.length > SCHEDULE_SKIP_MAX) return `Máximo ${SCHEDULE_SKIP_MAX} fechas de excepción.`
  if (!skip.every(isValidDate)) return "Hay una fecha inválida en las excepciones."
  if (s.validFrom !== undefined && !isValidDate(s.validFrom)) return "La fecha de inicio de vigencia no es válida."
  if (s.validUntil !== undefined && !isValidDate(s.validUntil)) return "La fecha de fin de vigencia no es válida."
  if (s.validFrom && s.validUntil && s.validUntil < s.validFrom) return "La vigencia termina antes de empezar."
  if (s.holidays !== undefined && s.holidays !== "skip" && s.holidays !== "only") return "La regla de festivos no es válida."
  if (s.note !== undefined && s.note.length > SCHEDULE_NOTE_MAX) return `La nota admite máximo ${SCHEDULE_NOTE_MAX} caracteres.`
  return null
}

// ── Texto legible ──

const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
const MONTH_NAMES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
const NTH_WORDS: Record<string, string> = { "1": "primer", "2": "segundo", "3": "tercer", "4": "cuarto", last: "último" }
const MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0]

const joinList = (xs: string[]) => (xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`)

function time12(t: string): string {
  const [h, m] = t.split(":").map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`
}

const range = (start?: string, end?: string) => (start ? (end ? `${time12(start)} a ${time12(end)}` : time12(start)) : "")

function dayMonth(iso: string): string {
  const [, m, d] = iso.split("-").map(Number)
  return `${d} de ${MONTH_NAMES[m - 1]}`
}

function fullDate(iso: string): string {
  return `${dayMonth(iso)} de ${iso.slice(0, 4)}`
}

const plural = (d: string) => (d.endsWith("s") ? d : `${d}s`)
const sortedDays = (w: Weekday[]) => MONDAY_FIRST.filter((d) => w.includes(d as Weekday)).map((d) => DAY_NAMES[d])

function ruleText(r: ScheduleRule): string {
  const t = "start" in r ? range(r.start, r.end) : ""
  const withTime = (base: string) => (t ? `${base} · ${t}` : base)
  switch (r.kind) {
    case "weekly": {
      const days = sortedDays(r.weekdays)
      return withTime(days.length === 1 ? `todos los ${plural(days[0])}` : `los ${joinList(days.map(plural))}`)
    }
    case "everyNWeeks":
      return withTime(`cada ${r.n} semanas, ${joinList(sortedDays(r.weekdays).map(plural))}`)
    case "monthlyNth":
      return withTime(`el ${NTH_WORDS[String(r.nth)]} ${DAY_NAMES[r.weekday]} de cada mes`)
    case "monthlyDay":
      return withTime(`el día ${r.dayOfMonth} de cada mes`)
    case "dates": {
      const ds = [...r.dates].sort()
      return withTime(ds.length <= 3 ? joinList(ds.map(dayMonth)) : `${ds.length} fechas, desde el ${dayMonth(ds[0])}`)
    }
    case "always":
      return t ? `todos los días · ${t}` : "mismo horario del sitio"
    case "byAppointment":
      return "solo con cita"
  }
}

/** "Todos los domingos · 6:00 a. m." — el texto que ve la gente, derivado del horario estructurado. */
export function describeSchedule(s: ActivitySchedule): string {
  const main = s.rules.map(ruleText).join("; ")
  const parts = [main.charAt(0).toUpperCase() + main.slice(1)]
  if (s.validFrom && s.validUntil) parts.push(`Del ${fullDate(s.validFrom)} al ${fullDate(s.validUntil)}`)
  else if (s.validFrom) parts.push(`Desde el ${fullDate(s.validFrom)}`)
  else if (s.validUntil) parts.push(`Hasta el ${fullDate(s.validUntil)}`)
  if (s.holidays === "skip") parts.push("No hay en festivos")
  if (s.holidays === "only") parts.push("Solo en festivos")
  if (s.requiresReservation) parts.push("Con reserva previa")
  let out = parts[0]
  for (const p of parts.slice(1)) out += `${out.endsWith(".") ? "" : "."} ${p}`
  return parts.length > 1 && !out.endsWith(".") ? `${out}.` : out
}
