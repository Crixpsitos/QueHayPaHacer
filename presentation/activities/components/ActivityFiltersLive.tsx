"use client"

import { useUrlFilters } from "@/presentation/activities/lib/useUrlFilters"
import { ActivityFilters } from "./ActivityFilters"

/** Chips de filtros con el estado activo tomado de la URL (ver `HubHeroLive`). */
export function ActivityFiltersLive() {
  return <ActivityFilters current={useUrlFilters()} />
}
