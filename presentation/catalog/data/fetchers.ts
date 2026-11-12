import { cacheLife, cacheTag } from "next/cache"
import { createServerContainer } from "@/infraestructure/di/container"
import type { SiteCatalog } from "@/domain/entities/catalog/SiteCatalog"

/**
 * Carta pública de un sitio. Caché de minutos; el panel invalida `site-catalog-<id>` al guardar. El WhatsApp y el número de
 * reservas son datos de contacto que el dueño puso para que lo busquen: son públicos por diseño.
 */
export const fetchSiteCatalog = async (siteId: string): Promise<SiteCatalog> => {
  "use cache"
  cacheLife("minutes")
  cacheTag(`site-catalog-${siteId}`)
  return createServerContainer().siteCatalogService.get(siteId)
}
