"use server"

import { createServerContainer } from "@/infraestructure/di/container"
import { getEventAccess, getPremiumSessionUid } from "@/app/actions/_session"
import { createLinkFlow, type CreateLinkResult } from "./_createLinkFlow"

/**
 * Crea un enlace de campaña (`/r/<código>`) sobre un evento o sitio PROPIO. La sesión sale de la cookie (las Server
 * Actions son endpoints públicos) y la propiedad de la ficha se comprueba aquí, en el servidor, no en la pantalla.
 */
export async function createLinkAction(raw: unknown): Promise<CreateLinkResult> {
  const uid = await getPremiumSessionUid()
  const { linksService, sitesService } = createServerContainer()
  return createLinkFlow(
    {
      uid,
      ownsEvent: async (id) => (await getEventAccess(id))?.role === "owner",
      ownsSite: async (id) => (uid ? sitesService.isOwner(uid, id) : false),
      countMine: () => (uid ? linksService.countByOwner(uid) : Promise.resolve(0)),
      create: (input) => linksService.create(input),
    },
    raw,
  )
}
