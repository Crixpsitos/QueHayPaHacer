import { updateTag, revalidateTag } from "next/cache"

/**
 * Invalida las cachés de actividades tras una escritura (read-your-own-writes). Único lugar con los nombres de tag:
 * `activities-<uid>` (Mis actividades), `activity-<id>` (ficha), `activity-list` (listados, home, sitemap) y
 * `site-<id>-activities` (bloque en la ficha del sitio). Debe llamarse desde dentro de una Server Action.
 */
export function revalidateActivity(uid: string, activityId: string, siteId?: string | null) {
  updateTag(`activities-${uid}`)
  updateTag(`activity-${activityId}`)
  if (siteId) updateTag(`site-${siteId}-activities`)
  revalidateTag("activity-list", "max")
  revalidateTag("sitemap", "max")
}
