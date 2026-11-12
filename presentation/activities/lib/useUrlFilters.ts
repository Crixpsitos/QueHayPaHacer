"use client"

import { useSearchParams } from "next/navigation"
import { parseFilters, type UrlFilters } from "@/domain/entities/activities/filters"

/** Filtros del hub leídos de la URL en el navegador. En navegación suave se resuelven al instante (sin esperar al servidor). */
export function useUrlFilters(): UrlFilters {
  return parseFilters(Object.fromEntries(useSearchParams().entries()))
}
