import { updateTag, revalidateTag } from "next/cache"

/**
 * Invalida las caches de sitios tras una escritura (read-your-own-writes).
 * Único lugar donde viven los nombres de tag → deben calzar con los `cacheTag`
 * de las páginas: `sites-<uid>` (grid), `site-<id>` (detalle/analytics) y
 * `profile-sites-<uid>` (perfil/trayectoria).
 * Debe llamarse desde dentro de una Server Action.
 */
export function revalidateSite(uid: string | null, siteId?: string) {
  if (uid) {
    updateTag(`sites-${uid}`)
    updateTag(`profile-sites-${uid}`)
  }
  if (siteId) updateTag(`site-${siteId}`)
  revalidateTag("explore", "max")
  // Invalida los listados públicos (donde-ir, home sitios populares)
  revalidateTag("site-list", "max")
  revalidateTag("featured-sites", "max")
}
