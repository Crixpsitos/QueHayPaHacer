/**
 * Tags de caché que hay que invalidar cuando cambia un sitio fuera de una Server Action (webhooks, barrido).
 * Una sola lista para /api/sites/revalidate, los webhooks de eventos y /api/sites/recompute-expired.
 * Debe calzar con los `cacheTag` de las páginas y con `revalidateSite` (app/actions/sites/_revalidate.ts):
 * `site-<id>` (detalle y ficha), `site-list` (todos los listados y landings por tipo, que también llevan
 * `site-collection-*` y `site-type-*`), `featured-sites`, `explore`, y por autor `sites-<uid>` (Mis sitios) y
 * `profile-sites-<uid>` (perfil).
 */
export function siteTagsToRevalidate(
  siteId: string,
  authorIds: Iterable<string | null | undefined> = [],
): string[] {
  const tags = new Set<string>([`site-${siteId}`, "site-list", "featured-sites", "explore"])
  for (const uid of authorIds) {
    if (uid) {
      tags.add(`sites-${uid}`)
      tags.add(`profile-sites-${uid}`)
    }
  }
  return [...tags]
}

/** Unión sin repetidos de los tags de varios sitios (`site-list` y compañía salen una sola vez). */
export function tagsForChangedSites(changed: { siteId: string; authorId: string | null }[]): string[] {
  const all = new Set<string>()
  for (const { siteId, authorId } of changed) for (const tag of siteTagsToRevalidate(siteId, [authorId])) all.add(tag)
  return [...all]
}
