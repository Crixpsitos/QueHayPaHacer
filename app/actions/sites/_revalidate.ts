import { updateTag, revalidateTag } from "next/cache"

/**
 * Invalida las caches de sitios tras una escritura (read-your-own-writes).
 * Único lugar donde viven los nombres de tag → deben calzar con los `cacheTag`
 * de las páginas: `sites-<uid>` (grid) y `site-<id>` (detalle/analytics).
 * Debe llamarse desde dentro de una Server Action.
 */
export function revalidateSite(uid: string, siteId?: string) {
  updateTag(`sites-${uid}`)
  if (siteId) updateTag(`site-${siteId}`)
  revalidateTag("explore")
}
