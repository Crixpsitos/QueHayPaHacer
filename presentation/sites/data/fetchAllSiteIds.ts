import { cacheLife, cacheTag } from "next/cache"
import { createServerContainer } from "@/infraestructure/di/container"

/**
 * Ids de los sitios públicos (hasta 30; la consulta cuesta una lectura por sitio aunque solo traiga ids).
 * Antes la pedían por separado el Home, Dónde ir y las colecciones, cada una con su propia caché de 10 min y por instancia.
 * Una sola caché de horas; se invalida con `site-list` (lo que se guarda desde la app).
 */
export const fetchAllSiteIds = async (): Promise<string[]> => {
  "use cache"
  cacheLife("hours")
  cacheTag("site-list")
  return createServerContainer().sitesService.getAllSites()
}
