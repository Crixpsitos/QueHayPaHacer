"use server"

import { updateTag } from "next/cache"
import { getAdminUid } from "@/app/actions/_admin"
import { createServerContainer } from "@/infraestructure/di/container"
import { parseHolidays } from "@/application/services/config/HolidayService"
import type { Holiday } from "@/domain/entities/holidays/colombiaHolidays"
import { HOLIDAYS_TAG } from "./_tags"

// Acciones del panel de administración. Cada una verifica en el servidor que la sesión sea de un admin.
type Result<T = object> = ({ success: true } & T) | { success: false; error: string }
const NOT_ALLOWED = { success: false, error: "No autorizado." } as const
const validYear = (y: unknown): y is number => Number.isInteger(y) && (y as number) >= 2000 && (y as number) <= 2100

export async function getHolidaysAdminAction(year: number): Promise<Result<{ holidays: Holiday[]; source: "config" | "computed" }>> {
  if (!(await getAdminUid())) return NOT_ALLOWED
  if (!validYear(year)) return { success: false, error: "Año inválido." }
  const y = await createServerContainer().holidayService.getYear(year)
  return { success: true, holidays: y.holidays, source: y.source }
}

/** Reemplaza la lista de festivos de un año (p. ej. un decreto movió uno) e invalida la caché. */
export async function saveHolidaysAction(year: number, holidays: Holiday[]): Promise<Result> {
  const uid = await getAdminUid()
  if (!uid) return NOT_ALLOWED
  if (!validYear(year)) return { success: false, error: "Año inválido." }
  const parsed = parseHolidays(year, holidays)
  if (!parsed.ok) return { success: false, error: parsed.error }
  await createServerContainer().holidayService.saveYear(year, parsed.holidays, uid)
  updateTag(HOLIDAYS_TAG)
  return { success: true }
}

/** Descarta la edición del año y vuelve al cálculo por regla. */
export async function resetHolidaysAction(year: number): Promise<Result> {
  if (!(await getAdminUid())) return NOT_ALLOWED
  if (!validYear(year)) return { success: false, error: "Año inválido." }
  await createServerContainer().holidayService.resetYear(year)
  updateTag(HOLIDAYS_TAG)
  return { success: true }
}

/** Botón "invalidar caché" de la configuración (hoy solo festivos; aquí se suman las demás etiquetas). */
export async function refreshConfigCacheAction(): Promise<Result> {
  if (!(await getAdminUid())) return NOT_ALLOWED
  updateTag(HOLIDAYS_TAG)
  return { success: true }
}
