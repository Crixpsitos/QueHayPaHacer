import type { DaySchedule, SiteSchedule, WeekDay } from "../view-models/SiteFormViewModel"
import type { HolidayPolicy, SiteOpeningPolicy } from "@/domain/entities/sites/value-objects/SiteOpeningPolicy"

const SITE_TZ = "America/Bogota"

const DAY_FROM_INTL: Record<string, WeekDay> = {
  Sun: "sunday", Mon: "monday", Tue: "tuesday", Wed: "wednesday",
  Thu: "thursday", Fri: "friday", Sat: "saturday",
}

const fmt = new Intl.DateTimeFormat("en-US", {
  timeZone: SITE_TZ, weekday: "short", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
})

const WEEK: WeekDay[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

const pad = (n: number) => String(n).padStart(2, "0")
/** "YYYY-MM-DD" del día siguiente a (y, m, d) del calendario civil. */
const nextDateKey = (y: number, m: number, d: number) => {
  const t = new Date(Date.UTC(y, m - 1, d + 1))
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
}

export interface OpenStatusContext {
  /** Festivos de Colombia: "YYYY-MM-DD" → nombre. Sin esto no se consideran festivos. */
  holidays?: Record<string, string> | null
  /** Política del sitio para festivos. Sin dato = "sin confirmar": se usa el horario normal. */
  policy?: SiteOpeningPolicy | null
}

/** Horario efectivo de un día: un festivo con política "cerrar"/"otro horario" reemplaza al del día de la semana. */
function effectiveDay(
  schedule: Partial<SiteSchedule>, weekday: WeekDay, dateKey: string, ctx?: OpenStatusContext,
): DaySchedule | undefined {
  const holiday = ctx?.holidays?.[dateKey]
  const h = ctx?.policy?.holidays
  if (holiday && h?.policy === "closed") return { open: "", close: "", closed: true }
  if (holiday && h?.policy === "custom" && h.open && h.close) return { open: h.open, close: h.close, closed: false }
  return schedule[weekday]
}

/** Ya cerró hoy (`openToday` null) → próxima apertura es mañana. */
function closedLabel(next: DaySchedule | undefined, openToday: string | null) {
  if (openToday) return `Cerrado · Abre ${openToday}`
  return next && !next.closed ? `Cerrado · Abre mañana ${next.open}` : "Cerrado"
}

const toMins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0) }

export interface SiteOpenStatus {
  isOpen: boolean
  /** null cuando el sitio no tiene horario */
  label: string | null
  todayKey: WeekDay
  todayHours: string | null
  /** Hoy es festivo. `policy` null = el sitio no dijo qué hace los festivos (hay que confirmarlo). */
  holiday: { name: string; policy: HolidayPolicy | null } | null
}

/**
 * Estado abierto/cerrado calculado en hora de Colombia (no la TZ del servidor,
 * que en Cloud Run es UTC). Soporta cierres pasada la medianoche (20:00–02:00).
 * Con `ctx` tiene en cuenta los festivos y lo que el sitio dijo hacer en ellos.
 */
export function getSiteOpenStatus(
  schedule: Partial<SiteSchedule> | null | undefined,
  now: Date = new Date(),
  ctx?: OpenStatusContext,
): SiteOpenStatus {
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]))
  const todayKey = DAY_FROM_INTL[parts.weekday]
  const todayDate = `${parts.year}-${parts.month}-${parts.day}`
  const holidayName = ctx?.holidays?.[todayDate]
  const holiday = holidayName ? { name: holidayName, policy: ctx?.policy?.holidays?.policy ?? null } : null
  if (!schedule) return { isOpen: false, label: null, todayKey, todayHours: null, holiday }

  const sched = effectiveDay(schedule, todayKey, todayDate, ctx)
  if (!sched || sched.closed) {
    return { isOpen: false, label: holiday?.policy === "closed" ? "Cerrado hoy · Festivo" : "Cerrado hoy", todayKey, todayHours: null, holiday }
  }

  const cur = Number(parts.hour) * 60 + Number(parts.minute)
  const open = toMins(sched.open)
  const close = toMins(sched.close)
  const isOpen = close > open ? cur >= open && cur < close : cur >= open || cur < close
  const tomorrowKey = WEEK[(WEEK.indexOf(todayKey) + 1) % 7]
  const tomorrow = effectiveDay(schedule, tomorrowKey, nextDateKey(+parts.year, +parts.month, +parts.day), ctx)
  return {
    isOpen,
    label: isOpen ? `Abierto · Cierra ${sched.close}` : closedLabel(tomorrow, cur >= close && close > open ? null : sched.open),
    todayKey,
    todayHours: `${sched.open} – ${sched.close}`,
    holiday,
  }
}
