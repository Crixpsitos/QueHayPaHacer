"use server"

import { cacheLife, cacheTag } from "next/cache"
import { createServerContainer } from "@/infraestructure/di/container"
import { HOLIDAYS_TAG } from "./_tags"

// Cacheado días: una lectura de Firestore por instancia y día, no por visita. Lo invalida el panel
// (saveHolidaysAction / refreshConfigCacheAction).
async function load(years: number[]) {
  "use cache"
  cacheLife("days")
  cacheTag(HOLIDAYS_TAG)
  return createServerContainer().holidayService.getMap(years)
}

const bogotaYear = () => Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Bogota", year: "numeric" }).format(new Date()))

/**
 * Festivos del año actual y el siguiente (cubre el cambio de año). Público: no hay datos personales.
 * Si falla devuelve vacío: el cliente ya trae el cálculo por regla.
 */
export async function getHolidaysAction(): Promise<{ holidays: Record<string, string>; configured: number[] }> {
  const year = bogotaYear()
  try {
    return await load([year, year + 1])
  } catch (e) {
    console.error("[getHolidays]", e)
    return { holidays: {}, configured: [] }
  }
}
