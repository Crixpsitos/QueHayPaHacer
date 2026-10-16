import type { IConfigRepository } from "@/domain/repository/config/IConfigRepository"
import { computeColombiaHolidays, holidayMap, type Holiday } from "@/domain/entities/holidays/colombiaHolidays"

export type HolidaySource = "config" | "computed"
const key = (year: number) => `holidays-${year}`

const MAX_HOLIDAYS_PER_YEAR = 40
const NAME_MAX = 80

/** Valida una lista editada a mano (panel de administración). Devuelve la lista limpia o un mensaje de error. */
export function parseHolidays(year: number, raw: unknown): { ok: true; holidays: Holiday[] } | { ok: false; error: string } {
  if (!Array.isArray(raw)) return { ok: false, error: "Lista inválida." }
  if (raw.length > MAX_HOLIDAYS_PER_YEAR) return { ok: false, error: `Máximo ${MAX_HOLIDAYS_PER_YEAR} festivos por año.` }
  const out: Holiday[] = []
  for (const item of raw) {
    const date = typeof item?.date === "string" ? item.date : ""
    const name = typeof item?.name === "string" ? item.name.trim() : ""
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return { ok: false, error: `Fecha inválida: ${date || "(vacía)"}` }
    if (!date.startsWith(`${year}-`)) return { ok: false, error: `${date} no es de ${year}.` }
    if (!name || name.length > NAME_MAX) return { ok: false, error: `Nombre inválido para ${date} (1–${NAME_MAX} caracteres).` }
    out.push({ date, name })
  }
  return { ok: true, holidays: out.sort((a, b) => a.date.localeCompare(b.date)) }
}

export class HolidayService {
  constructor(private readonly config: IConfigRepository) {}

  /** Festivos de un año: lo guardado por el administrador o, si no hay, lo calculado por regla. */
  async getYear(year: number): Promise<{ year: number; holidays: Holiday[]; source: HolidaySource; updatedBy: string | null }> {
    const doc = await this.config.get<{ holidays?: Holiday[] }>(key(year))
    if (doc?.data.holidays?.length) return { year, holidays: doc.data.holidays, source: "config", updatedBy: doc.updatedBy }
    return { year, holidays: computeColombiaHolidays(year), source: "computed", updatedBy: null }
  }

  /** Fecha → nombre de los años pedidos, y de cuáles hay configuración propia. */
  async getMap(years: number[]): Promise<{ holidays: Record<string, string>; configured: number[] }> {
    const parts = await Promise.all(years.map((y) => this.getYear(y)))
    return {
      holidays: holidayMap(parts.flatMap((p) => p.holidays)),
      configured: parts.filter((p) => p.source === "config").map((p) => p.year),
    }
  }

  async saveYear(year: number, holidays: Holiday[], uid: string): Promise<void> {
    await this.config.set(key(year), { year, holidays, source: "manual" }, uid)
  }

  /** Vuelve al cálculo por regla (borra la configuración propia del año). */
  async resetYear(year: number): Promise<void> {
    await this.config.delete(key(year))
  }

  /** Guarda el cálculo por regla solo si el año aún no tiene configuración (no pisa ediciones). */
  async seedYear(year: number, updatedBy: string): Promise<"created" | "exists"> {
    if (await this.config.get(key(year))) return "exists"
    await this.config.set(key(year), { year, holidays: computeColombiaHolidays(year), source: "computed" }, updatedBy)
    return "created"
  }
}
