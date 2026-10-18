"use server"

import { updateTag } from "next/cache"
import { getSessionUid } from "@/app/actions/_session"
import { createServerContainer } from "@/infraestructure/di/container"

/**
 * "Está desactualizado" en los buses de un sitio. Exige sesión; una vez por persona y sitio; no el autor.
 * Al llegar a 3 personas distintas el sitio pasa a "por confirmar" y se avisa al autor por la campanita.
 */
export async function reportTransitOutdatedAction(siteId: string): Promise<{ success: true } | { success: false; error: string }> {
  const uid = await getSessionUid()
  if (!uid) return { success: false, error: "Inicia sesión para reportar." }
  if (typeof siteId !== "string" || !siteId) return { success: false, error: "Sitio inválido." }

  try {
    const { siteTransitService, notificationService } = createServerContainer()
    const res = await siteTransitService.report(uid, siteId)
    if (!res.success) return res
    updateTag(`site-${siteId}`)
    if (res.reachedThreshold) {
      // Un solo aviso por versión del bloque de buses (el id hace el aviso idempotente aunque lleguen más reportes).
      await notificationService.notify(
        res.authorId,
        {
          type: "transit_outdated",
          title: `Los buses de "${res.siteName}" podrían estar desactualizados`,
          body: "Varias personas avisaron que cambiaron. Revísalos y vuelve a guardar para reconfirmarlos.",
          href: "/sites",
        },
        `transit-outdated-${siteId}-${res.updatedAt}`,
      )
    }
    return { success: true }
  } catch (e) {
    console.error("[reportTransitOutdated]", e)
    return { success: false, error: "No se pudo enviar el reporte. Intenta nuevamente." }
  }
}
