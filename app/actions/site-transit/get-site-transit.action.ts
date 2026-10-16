"use server"

import { cacheLife, cacheTag } from "next/cache"
import { createServerContainer } from "@/infraestructure/di/container"
import { TRANSIT_TAG } from "@/app/actions/config/_tags"
import type { SiteTransitView } from "@/domain/entities/sites/value-objects/SiteTransit"

// Vida corta: "por confirmar" (reportes) debe aparecer en minutos, no en horas. Se invalida con `site-<id>`
// (reporte, edición del sitio) y con la etiqueta del catálogo (ruta marcada como cambiada).
async function load(siteId: string) {
  "use cache"
  cacheLife("minutes")
  cacheTag(`site-${siteId}`, TRANSIT_TAG)
  return createServerContainer().siteTransitService.getView(siteId)
}

/** Buses del sitio con su estado (ok / por confirmar), o null si no hay dato. Público: no incluye quién reportó. */
export async function getSiteTransitViewAction(siteId: string): Promise<SiteTransitView | null> {
  if (typeof siteId !== "string" || !siteId) return null
  try {
    return await load(siteId)
  } catch (e) {
    console.error("[getSiteTransitView]", e)
    return null
  }
}
