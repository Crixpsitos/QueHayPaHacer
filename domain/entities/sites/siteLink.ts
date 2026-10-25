import { initialVerification, type SitePublishedAs, type SiteVerification } from "./value-objects/SiteListing"

/** Lo mínimo de un sitio para decidir si un evento puede vincularse a él. */
export interface SiteLinkSnapshot {
  authorId: string | null
  publishedAs?: SitePublishedAs | null
  verification?: SiteVerification | null
  publicationStatus?: string | null
  moderationStatus?: string | null
}

export const SITE_LINK_ERROR =
  "Solo puedes vincular tu evento a un sitio tuyo, publicado como dueño y ya aprobado."

/**
 * ¿Es un sitio "de verdad propio" y listo para tener eventos? Lo publicó su dueño (no "proposer" de la comunidad ni
 * "qhpa"), no es "community" y está publicado y aprobado. Un doc antiguo sin `publishedAs` se lee como "proposer"
 * (igual que el mapper), así que no cuenta. No mira de quién es: eso lo hace `canLinkEventToSite`.
 */
export function isLinkableSite(site: Omit<SiteLinkSnapshot, "authorId">): boolean {
  const publishedAs = site.publishedAs ?? "proposer"
  if (publishedAs !== "owner") return false
  if ((site.verification ?? initialVerification(publishedAs)) === "community") return false
  return site.publicationStatus === "published" && site.moderationStatus === "approved"
}

/** ¿Puede `uid` vincular un evento suyo a este sitio? Debe ser el autor del sitio y el sitio, vinculable. */
export function canLinkEventToSite(site: SiteLinkSnapshot | null | undefined, uid: string): boolean {
  return !!site && !!uid && site.authorId === uid && isLinkableSite(site)
}

/**
 * Error (o null) al guardar un evento/sesión con `nextSiteId`. Solo valida cuando el vínculo es NUEVO o CAMBIA
 * respecto de lo guardado: los eventos ya vinculados a un sitio que hoy no es elegible se respetan hasta que alguien
 * edite el vínculo. `getSnapshot` lee el sitio (el servidor lo inyecta).
 */
export async function siteLinkViolation(
  params: { ownerId: string; nextSiteId?: string | null; previousSiteId?: string | null },
  getSnapshot: (siteId: string) => Promise<SiteLinkSnapshot | null>,
): Promise<string | null> {
  const { ownerId, nextSiteId, previousSiteId } = params
  if (!nextSiteId || nextSiteId === previousSiteId) return null
  return canLinkEventToSite(await getSnapshot(nextSiteId), ownerId) ? null : SITE_LINK_ERROR
}
