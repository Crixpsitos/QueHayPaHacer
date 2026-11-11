import type { ActivitySchedule } from "@/domain/entities/activities/value-objects/ActivitySchedule"
import { bogotaDateIso, nextOccurrence } from "@/domain/entities/activities/value-objects/occurrences"

const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
const DAY_MS = 86_400_000
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const dayNum = (iso: string) => Math.round(Date.parse(`${iso}T00:00:00Z`) / DAY_MS)

function time12(date: Date): string {
  const bogota = new Date(date.getTime() - 5 * 3_600_000)
  const h = bogota.getUTCHours()
  return `${h % 12 || 12}:${String(bogota.getUTCMinutes()).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`
}

export interface NextDepartureLabel {
  /** "Domingo 15 de noviembre" */
  dateLabel: string
  /** "6:00 a. m." o null si la regla no tiene hora. */
  timeLabel: string | null
  /** "Hoy" | "Mañana" | "En 5 días" */
  relative: string
}

/** Texto de "Próxima salida". Depende del reloj, así que se calcula en el navegador (la ficha se cachea por horas). */
export function nextDepartureLabel(schedule: ActivitySchedule, now: Date): NextDepartureLabel | null {
  const o = nextOccurrence(schedule, now)
  if (!o) return null
  const [y, m, d] = o.date.split("-").map(Number)
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  const diff = dayNum(o.date) - dayNum(bogotaDateIso(now))
  return {
    dateLabel: `${cap(DAYS[weekday])} ${d} de ${MONTHS[m - 1]}`,
    timeLabel: o.startsAt ? time12(o.startsAt) : null,
    relative: diff <= 0 ? "Hoy" : diff === 1 ? "Mañana" : `En ${diff} días`,
  }
}
