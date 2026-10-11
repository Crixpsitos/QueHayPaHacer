import type { SiteSchedule, WeekDay } from "../view-models/SiteFormViewModel"

const SITE_TZ = "America/Bogota"

const DAY_FROM_INTL: Record<string, WeekDay> = {
  Sun: "sunday", Mon: "monday", Tue: "tuesday", Wed: "wednesday",
  Thu: "thursday", Fri: "friday", Sat: "saturday",
}

const fmt = new Intl.DateTimeFormat("en-US", {
  timeZone: SITE_TZ, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
})

const WEEK: WeekDay[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

/** Ya cerró hoy (`openToday` null) → próxima apertura es mañana. */
function closedLabel(schedule: Partial<SiteSchedule>, todayKey: WeekDay, openToday: string | null) {
  if (openToday) return `Cerrado · Abre ${openToday}`
  const next = schedule[WEEK[(WEEK.indexOf(todayKey) + 1) % 7]]
  return next && !next.closed ? `Cerrado · Abre mañana ${next.open}` : "Cerrado"
}

const toMins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0) }

export interface SiteOpenStatus {
  isOpen: boolean
  /** null cuando el sitio no tiene horario */
  label: string | null
  todayKey: WeekDay
  todayHours: string | null
}

/**
 * Estado abierto/cerrado calculado en hora de Colombia (no la TZ del servidor,
 * que en Cloud Run es UTC). Soporta cierres pasada la medianoche (20:00–02:00).
 */
export function getSiteOpenStatus(
  schedule: Partial<SiteSchedule> | null | undefined,
  now: Date = new Date(),
): SiteOpenStatus {
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]))
  const todayKey = DAY_FROM_INTL[parts.weekday]
  if (!schedule) return { isOpen: false, label: null, todayKey, todayHours: null }

  const sched = schedule[todayKey]
  if (!sched || sched.closed) return { isOpen: false, label: "Cerrado hoy", todayKey, todayHours: null }

  const cur = Number(parts.hour) * 60 + Number(parts.minute)
  const open = toMins(sched.open)
  const close = toMins(sched.close)
  const isOpen = close > open ? cur >= open && cur < close : cur >= open || cur < close
  return {
    isOpen,
    label: isOpen ? `Abierto · Cierra ${sched.close}` : closedLabel(schedule, todayKey, cur >= close && close > open ? null : sched.open),
    todayKey,
    todayHours: `${sched.open} – ${sched.close}`,
  }
}
