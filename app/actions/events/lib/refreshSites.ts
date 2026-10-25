import { revalidateSite } from "@/app/actions/sites/_revalidate";
import { refreshSiteEventCounts } from "@/app/lib/sites/siteEvents";

/**
 * Recuenta los eventos de esos sitios (analytics.eventCount + score) e invalida sus cachés. Solo desde Server
 * Actions (usa `updateTag`); los webhooks usan `revalidateSitesFromRoute`. Nunca lanza.
 */
export async function refreshSitesOfEvent(siteIds: Iterable<string | null | undefined>): Promise<void> {
  for (const { siteId, authorId } of await refreshSiteEventCounts(siteIds)) revalidateSite(authorId, siteId);
}
