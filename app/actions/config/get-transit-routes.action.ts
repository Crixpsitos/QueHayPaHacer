"use server"

import { cacheLife, cacheTag } from "next/cache"
import { createServerContainer } from "@/infraestructure/di/container"
import type { TransitRoute } from "@/domain/entities/sites/value-objects/SiteTransit"
import { TRANSIT_TAG } from "./_tags"

// Cacheado días: una lectura de Firestore por instancia y día. Lo invalidan las acciones de administración.
async function load() {
  "use cache"
  cacheLife("days")
  cacheTag(TRANSIT_TAG)
  return createServerContainer().transitRouteService.list()
}

/** Catálogo de rutas de bus (solo números/nombres, sin trazado). Público: no hay datos personales. */
export async function getTransitRoutesAction(): Promise<TransitRoute[]> {
  try {
    return await load()
  } catch (e) {
    console.error("[getTransitRoutes]", e)
    return []
  }
}
