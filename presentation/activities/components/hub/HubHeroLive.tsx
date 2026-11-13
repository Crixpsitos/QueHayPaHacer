"use client"

import type { HubMeta } from "@/presentation/activities/data/fetchers"
import { useUrlFilters } from "@/presentation/activities/lib/useUrlFilters"
import { HubHero } from "./HubHero"

/** Cabecera con el día/atajo activo tomado de la URL: cambiar de filtro no la recarga ni la reemplaza por un esqueleto. */
export function HubHeroLive({ meta }: { meta: HubMeta }) {
  return <HubHero current={useUrlFilters()} meta={meta} />
}
