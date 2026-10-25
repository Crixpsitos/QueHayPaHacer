import { revalidateTag } from "next/cache"
import { createServerContainer } from "@/infraestructure/di/container"
import { eventAtSiteNotice, recountSites } from "./siteEventsCore"
import { tagsForChangedSites } from "@/app/api/sites/_lib/siteTags"

type EventRef = { id?: string; title?: string; author?: { id: string }; location?: { siteId?: string | null } | null }

/**
 * Sitios con los que está vinculado un evento: el de su `location.siteId` (evento único) y los de sus sesiones
 * (multi-fecha). Se usa ANTES y DESPUÉS de un cambio para recontar los sitios que ganan o pierden el evento.
 */
export async function linkedSiteIds(event: EventRef | null | undefined): Promise<string[]> {
  if (!event) return []
  const ids = new Set<string>()
  if (event.location?.siteId) ids.add(event.location.siteId)
  if (event.id) {
    try {
      const sessions = await createServerContainer().eventSessionService.getByEventId(event.id)
      for (const s of sessions) if (s.location?.siteId) ids.add(s.location.siteId)
    } catch (error) {
      console.error("[linkedSiteIds]", error)
    }
  }
  return [...ids]
}

/**
 * Recuenta `analytics.eventCount` (y el score) de esos sitios. Devuelve los que cambiaron, con su autor, para que
 * quien llama invalide cachés. Nunca lanza: el conteo es un efecto secundario del evento, no debe romper su guardado.
 */
export async function refreshSiteEventCounts(
  siteIds: Iterable<string | null | undefined>,
): Promise<{ siteId: string; authorId: string | null }[]> {
  const { eventsService, sitesService } = createServerContainer()
  return recountSites(
    siteIds,
    { state: (id) => eventsService.siteEventStateBySiteId(id), set: (id, s) => sitesService.setEventCount(id, s) },
    (siteId, error) => console.error("[refreshSiteEventCounts]", siteId, error),
  )
}

/** Invalidación desde Route Handlers (webhooks): `expire: 0`; misma lista de tags que app/api/sites/revalidate. */
export function revalidateSitesFromRoute(changed: { siteId: string; authorId: string | null }[]) {
  for (const tag of tagsForChangedSites(changed)) revalidateTag(tag, { expire: 0 })
}

/**
 * Avisa por la campanita al autor de cada sitio donde se acaba de publicar un evento ajeno. Idempotente por
 * evento+sitio (id del aviso): republicar o editar no vuelve a avisar. `notify` nunca lanza.
 */
export async function notifySiteAuthorsOfEvent(event: EventRef & { id: string; title: string; author: { id: string } }): Promise<void> {
  const { sitesService, notificationService } = createServerContainer()
  for (const siteId of await linkedSiteIds(event)) {
    const site = await sitesService.getTitleAndAuthor(siteId).catch(() => null)
    const notice = site && eventAtSiteNotice(event, { id: siteId, ...site })
    if (notice) await notificationService.notify(notice.to, notice.notification, notice.id)
  }
}
