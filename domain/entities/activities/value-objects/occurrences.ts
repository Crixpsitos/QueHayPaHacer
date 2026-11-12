import { computeColombiaHolidays } from "@/domain/entities/holidays/colombiaHolidays"
import type { ActivitySchedule, ScheduleRule, Weekday } from "./ActivitySchedule"

/**
 * Motor de recurrencia (spec 5.4): TODO lo que se muestra o filtra ("Próxima salida", "Hoy", días de la
 * semana) se deriva de aquí. Trabaja con fechas civiles "YYYY-MM-DD" de Bogotá (UTC-5 todo el año) y no
 * lee el reloj: quien llama pasa `now`.
 */
export interface Occurrence {
  /** Día civil de Bogotá. */
  date: string
  /** Instante de inicio (UTC) o null si la regla no tiene hora. */
  startsAt: Date | null
  endsAt: Date | null
}

const DAY_MS = 86_400_000
const BOGOTA_OFFSET_MS = 5 * 3_600_000
/** Tope de días por consulta: evita rangos enormes (abuso o error). */
export const MAX_RANGE_DAYS = 400

const toDayNum = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS)
}
const fromDayNum = (n: number) => new Date(n * DAY_MS).toISOString().slice(0, 10)
/** 1970-01-01 fue jueves (4). */
const weekdayOf = (n: number): Weekday => ((((n % 7) + 7 + 4) % 7) as Weekday)
const mondayOf = (n: number) => n - ((weekdayOf(n) + 6) % 7)
const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate()

/** Fecha civil de Bogotá a la que corresponde `now`. */
export const bogotaDateIso = (now: Date) => new Date(now.getTime() - BOGOTA_OFFSET_MS).toISOString().slice(0, 10)

const instant = (iso: string, hhmm: string) => {
  const [y, m, d] = iso.split("-").map(Number)
  const [h, mi] = hhmm.split(":").map(Number)
  return new Date(Date.UTC(y, m - 1, d, h, mi) + BOGOTA_OFFSET_MS)
}

function matches(rule: ScheduleRule, n: number, iso: string): boolean {
  const wd = weekdayOf(n)
  switch (rule.kind) {
    case "weekly":
      return rule.weekdays.includes(wd)
    case "everyNWeeks": {
      const anchor = toDayNum(rule.anchorDate)
      if (n < anchor || !rule.weekdays.includes(wd)) return false
      return ((mondayOf(n) - mondayOf(anchor)) / 7) % rule.n === 0
    }
    case "monthlyNth": {
      if (wd !== rule.weekday) return false
      const [y, m, d] = iso.split("-").map(Number)
      return rule.nth === "last" ? d + 7 > daysInMonth(y, m) : Math.ceil(d / 7) === rule.nth
    }
    case "monthlyDay":
      return Number(iso.slice(8)) === rule.dayOfMonth
    case "dates":
      return rule.dates.includes(iso)
    case "always":
      return true
    case "byAppointment":
      return false
  }
}

const holidayYears = new Map<number, Set<string>>()
/** ¿Es festivo en Colombia (Ley Emiliani, calculado por regla)? Se guarda por año. */
function isHoliday(iso: string): boolean {
  const y = Number(iso.slice(0, 4))
  let set = holidayYears.get(y)
  if (!set) { set = new Set(computeColombiaHolidays(y).map((h) => h.date)); holidayYears.set(y, set) }
  return set.has(iso)
}

/** Ocurrencias entre dos fechas civiles (inclusive), ordenadas. Máx. 400 días desde `from`. */
export function occurrencesBetween(s: ActivitySchedule, from: string, to: string): Occurrence[] {
  const a = toDayNum(from)
  const b = Math.min(toDayNum(to), a + MAX_RANGE_DAYS - 1)
  const skip = new Set(s.skipDates)
  const out: Occurrence[] = []
  for (let n = a; n <= b; n++) {
    const iso = fromDayNum(n)
    if ((s.validFrom && iso < s.validFrom) || (s.validUntil && iso > s.validUntil) || skip.has(iso)) continue
    if (s.holidays && (s.holidays === "only") !== isHoliday(iso)) continue
    const seen = new Set<string>()
    for (const rule of s.rules) {
      if (!matches(rule, n, iso)) continue
      const start = "start" in rule ? rule.start : undefined
      const end = "end" in rule ? rule.end : undefined
      const key = `${start ?? ""}|${end ?? ""}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ date: iso, startsAt: start ? instant(iso, start) : null, endsAt: start && end ? instant(iso, end) : null })
    }
  }
  return out.sort((x, y) => x.date.localeCompare(y.date) || (x.startsAt?.getTime() ?? 0) - (y.startsAt?.getTime() ?? 0))
}

/**
 * Próxima salida: la primera que aún no terminó (en curso cuenta). Sin hora de fin, vale hasta su inicio;
 * sin hora, hasta el final del día. `horizonDays` limita la búsqueda.
 */
export function nextOccurrence(s: ActivitySchedule, now: Date, horizonDays = MAX_RANGE_DAYS): Occurrence | null {
  const today = bogotaDateIso(now)
  const last = fromDayNum(toDayNum(today) + Math.min(horizonDays, MAX_RANGE_DAYS) - 1)
  for (const o of occurrencesBetween(s, today, last)) {
    const until = o.endsAt ?? o.startsAt ?? new Date(instant(o.date, "23:59").getTime() + 59_999)
    if (until.getTime() >= now.getTime()) return o
  }
  return null
}

export const occursOn = (s: ActivitySchedule, dateIso: string) => occurrencesBetween(s, dateIso, dateIso).length > 0

/** Días de la semana (0–6) en que puede haber actividad: para consultas "hoy" sin escanear la colección. */
export function occursWeekdays(s: ActivitySchedule): Weekday[] {
  const set = new Set<Weekday>()
  const all = [0, 1, 2, 3, 4, 5, 6] as Weekday[]
  for (const r of s.rules) {
    if (r.kind === "weekly" || r.kind === "everyNWeeks") r.weekdays.forEach((w) => set.add(w))
    else if (r.kind === "monthlyNth") set.add(r.weekday)
    else if (r.kind === "dates") r.dates.forEach((d) => set.add(weekdayOf(toDayNum(d))))
    else if (r.kind === "monthlyDay" || r.kind === "always") all.forEach((w) => set.add(w))
  }
  return [...set].sort((a, b) => a - b)
}
