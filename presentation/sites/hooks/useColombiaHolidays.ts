"use client"

import { useSyncExternalStore } from "react"
import { computeColombiaHolidays, holidayMap } from "@/domain/entities/holidays/colombiaHolidays"
import { getHolidaysAction } from "@/app/actions/config/get-holidays.action"

/**
 * Festivos de Colombia del año actual y el siguiente, fecha → nombre.
 * `null` en el servidor / prerender (así no hay `new Date()` ni desajuste de hidratación). En el cliente arranca
 * con el cálculo por regla (sin esperar red) y, si el administrador editó algún año, lo reemplaza con la
 * configuración cacheada del servidor.
 */
type Holidays = Record<string, string>

let current: Holidays | null = null
let fetching = false
const listeners = new Set<() => void>()

const bogotaYear = () => Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Bogota", year: "numeric" }).format(new Date()))

function snapshot(): Holidays {
  if (!current) {
    const y = bogotaYear()
    current = holidayMap([...computeColombiaHolidays(y), ...computeColombiaHolidays(y + 1)])
  }
  return current
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!fetching) {
    fetching = true // una sola petición por carga de página, compartida por todos los componentes
    getHolidaysAction()
      .then(({ holidays, configured }) => {
        if (configured.length) {
          current = holidays
          listeners.forEach((l) => l())
        }
      })
      .catch(() => { fetching = false })
  }
  return () => { listeners.delete(listener) }
}

export function useColombiaHolidays(): Holidays | null {
  return useSyncExternalStore(subscribe, snapshot, () => null)
}
