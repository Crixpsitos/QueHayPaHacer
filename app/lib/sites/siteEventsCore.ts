import type { NewNotification } from "@/domain/entities/notification/Notification"

export interface RecountDeps {
  count(siteId: string): Promise<number>
  /** Escribe eventCount+score; devuelve el autor si cambió algo, `null` si ya estaba al día o el sitio no existe. */
  set(siteId: string, count: number): Promise<{ authorId: string | null } | null>
}

/**
 * Recuenta cada sitio (sin repetidos ni vacíos) y devuelve solo los que cambiaron. Un fallo en uno no frena a los demás:
 * el conteo es un efecto secundario del evento y no debe romper su guardado.
 */
export async function recountSites(
  siteIds: Iterable<string | null | undefined>,
  deps: RecountDeps,
  onError: (siteId: string, error: unknown) => void = () => {},
): Promise<{ siteId: string; authorId: string | null }[]> {
  const changed: { siteId: string; authorId: string | null }[] = []
  for (const siteId of new Set([...siteIds].filter((id): id is string => !!id))) {
    try {
      const result = await deps.set(siteId, await deps.count(siteId))
      if (result) changed.push({ siteId, authorId: result.authorId })
    } catch (error) {
      onError(siteId, error)
    }
  }
  return changed
}

/** Aviso para el autor del sitio cuando se publica un evento de OTRA persona en él. `null` si es el mismo autor o no hay autor. */
export function eventAtSiteNotice(
  event: { id: string; title: string; author: { id: string } },
  site: { id: string; title: string; authorId: string | null },
): { to: string; id: string; notification: NewNotification } | null {
  if (!site.authorId || site.authorId === event.author.id) return null
  return {
    to: site.authorId,
    // id idempotente: republicar o editar el evento no vuelve a avisar
    id: `event_at_site_${event.id}_${site.id}`,
    notification: {
      type: "event_at_site",
      title: `Se publicó un evento en tu sitio "${site.title}"`,
      body: event.title,
      href: `/eventos/${event.id}`,
    },
  }
}
