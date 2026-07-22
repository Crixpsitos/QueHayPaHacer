import type { SiteDetail } from "../view-models/SiteFormViewModel";
import type { SiteCollectionDef } from "./siteCollections";

export interface SiteCategoryGroup {
  key: string;
  label: string;
  landingSlug?: string; // slug de la landing del tipo (para "Ver más")
  sites: SiteDetail[];
}

/** Agrupa sitios por su tipo (category), resolviendo la landing de cada tipo. */
export function groupSitesByCategory(
  sites: SiteDetail[],
  collections: SiteCollectionDef[],
): SiteCategoryGroup[] {
  const byCat = new Map<string, { label: string; slug: string }>();
  for (const c of collections) {
    if (c.kind !== "type" || !c.category) continue;
    byCat.set(c.category, { label: c.shortLabel, slug: c.slug });
  }

  const groups = new Map<string, SiteCategoryGroup>();
  for (const s of sites) {
    const resolved = byCat.get(s.category);
    const label = resolved?.label ?? s.category ?? "Otros";
    const key = resolved?.slug ?? label;
    let g = groups.get(key);
    if (!g) {
      g = { key, label, landingSlug: resolved?.slug, sites: [] };
      groups.set(key, g);
    }
    g.sites.push(s);
  }
  return [...groups.values()];
}
