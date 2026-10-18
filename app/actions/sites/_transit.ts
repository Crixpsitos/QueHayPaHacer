import { createServerContainer } from "@/infraestructure/di/container"
import type { SiteInput } from "@/application/services/sites/SitesService"
import type { SiteFormViewModel } from "@/presentation/sites/view-models/SiteFormViewModel"

/**
 * Agrega a `input` el bloque de buses validado en el servidor contra el catálogo vigente, con `updatedAt` fijado
 * aquí (lo que mande el cliente se ignora). Ver `SiteTransitService.resolveForSave`.
 */
export async function withTransit(input: SiteInput, form: SiteFormViewModel, siteId?: string): Promise<SiteInput> {
  const transit = await createServerContainer().siteTransitService.resolveForSave(form.transit, siteId)
  // undefined = no tocar; null en un sitio nuevo = nada que guardar
  if (transit === undefined || (transit === null && !siteId)) return input
  return { ...input, transit }
}
