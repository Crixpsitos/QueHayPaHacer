import { siteLinkViolation } from "@/domain/entities/sites/siteLink";
import { createServerContainer } from "@/infraestructure/di/container";

/**
 * Error (o null) al guardar un evento con `nextSiteId`: solo se puede vincular a un sitio PROPIO del dueño del
 * evento (publicado como dueño y aprobado; ver domain/entities/sites/siteLink). Solo mira vínculos nuevos o
 * cambiados: los ya guardados se respetan. El selector del wizard ya filtra, pero el servidor no confiaba en él.
 */
export async function siteLinkError(
  ownerId: string,
  nextSiteId: string | null | undefined,
  previousSiteId?: string | null,
): Promise<string | null> {
  return siteLinkViolation({ ownerId, nextSiteId, previousSiteId }, (id) =>
    createServerContainer().sitesService.getLinkSnapshot(id),
  );
}
