/**
 * Festivos de Colombia calculados por regla (Ley 51 de 1983, "Ley Emiliani"); no dependen de ninguna API.
 *  - Fijos que nunca se mueven: 1 ene, 1 may, 20 jul, 7 ago, 8 dic, 25 dic.
 *  - Jueves y Viernes Santo (Pascua −3 y −2), tampoco se mueven.
 *  - Se trasladan al lunes siguiente (si ya es lunes, se quedan): 6 ene, 19 mar, 29 jun, 15 ago, 12 oct,
 *    1 nov, 11 nov, y Ascensión (Pascua +39), Corpus Christi (+60) y Sagrado Corazón (+68).
 * La fuente de verdad en producción es la colección `appConfig` (editable por el administrador); esto es el
 * valor por defecto y lo que se siembra. Fechas como "YYYY-MM-DD" (calendario civil, sin zona horaria).
 */
export interface Holiday {
  date: string
  name: string
}

const pad = (n: number) => String(n).padStart(2, "0")
const iso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d))
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000)

/** Domingo de Pascua (calendario gregoriano; algoritmo de Meeus/Jones/Butcher). */
export function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return utc(year, month, day)
}

/** Lunes igual o posterior a `d` (Ley Emiliani). */
const nextMonday = (d: Date) => addDays(d, (8 - d.getUTCDay()) % 7)

export function computeColombiaHolidays(year: number): Holiday[] {
  const easter = easterSunday(year)
  const list: Holiday[] = [
    { date: iso(utc(year, 1, 1)), name: "Año Nuevo" },
    { date: iso(nextMonday(utc(year, 1, 6))), name: "Día de los Reyes Magos" },
    { date: iso(nextMonday(utc(year, 3, 19))), name: "Día de San José" },
    { date: iso(addDays(easter, -3)), name: "Jueves Santo" },
    { date: iso(addDays(easter, -2)), name: "Viernes Santo" },
    { date: iso(utc(year, 5, 1)), name: "Día del Trabajo" },
    { date: iso(nextMonday(addDays(easter, 39))), name: "Ascensión del Señor" },
    { date: iso(nextMonday(addDays(easter, 60))), name: "Corpus Christi" },
    { date: iso(nextMonday(addDays(easter, 68))), name: "Sagrado Corazón de Jesús" },
    { date: iso(nextMonday(utc(year, 6, 29))), name: "San Pedro y San Pablo" },
    { date: iso(utc(year, 7, 20)), name: "Día de la Independencia" },
    { date: iso(utc(year, 8, 7)), name: "Batalla de Boyacá" },
    { date: iso(nextMonday(utc(year, 8, 15))), name: "Asunción de la Virgen" },
    { date: iso(nextMonday(utc(year, 10, 12))), name: "Día de la Raza" },
    { date: iso(nextMonday(utc(year, 11, 1))), name: "Todos los Santos" },
    { date: iso(nextMonday(utc(year, 11, 11))), name: "Independencia de Cartagena" },
    { date: iso(utc(year, 12, 8)), name: "Inmaculada Concepción" },
    { date: iso(utc(year, 12, 25)), name: "Navidad" },
  ]
  return list.sort((x, y) => x.date.localeCompare(y.date))
}

/** Fecha → nombre. Si dos festivos caen el mismo día (p. ej. 2025-06-30) se unen con " y ". */
export function holidayMap(holidays: Holiday[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const h of holidays) out[h.date] = out[h.date] ? `${out[h.date]} y ${h.name}` : h.name
  return out
}
