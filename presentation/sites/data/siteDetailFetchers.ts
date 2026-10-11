import { cacheLife, cacheTag } from "next/cache";
import { createServerContainer } from "@/infraestructure/di/container";
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper";
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel";

/** Visible al público: publicado, aprobado y no desactivado por el dueño. */
export function isSitePublic(site: Pick<SiteDetail, "publicationStatus" | "moderationStatus" | "isActive">): boolean {
  return site.publicationStatus === "published" && site.moderationStatus === "approved" && site.isActive !== false;
}

/**
 * Detalle PÚBLICO de un sitio por slug o id. Devuelve null si no existe o no es
 * público (borrador, pendiente, rechazado, inactivo). Compartido por metadata,
 * página y contenedor → una sola lectura a Firestore por render.
 */
export const fetchPublicSiteDetail = async (idOrSlug: string): Promise<SiteDetail | null> => {
  "use cache";
  // ponytail: la moderación no invalida tags → un sitio recién aprobado tarda ≤1h en aparecer.
  cacheLife("hours");
  cacheTag(`site-${idOrSlug}`);
  const { sitesService } = createServerContainer();
  const site =
    (await sitesService.getSiteDetailBySlug(idOrSlug)) ?? (await sitesService.getSiteDetailById(idOrSlug));
  // Las actions invalidan `site-<id>`, no el slug.
  if (site) cacheTag(`site-${site.id}`);
  return site && isSitePublic(site) ? site : null;
};

/** Próximos eventos vinculados a un sitio (itinerario del detalle). */
export const fetchSiteLinkedEvents = async (siteId: string) => {
  "use cache";
  cacheLife("hours");
  cacheTag(`site-${siteId}`, "event-list");
  const { eventsService } = createServerContainer();
  const events = await eventsService.getEventsBySiteId(siteId, 8);
  return events.map((e) => EventViewModelMapper.toViewModel(e));
};
