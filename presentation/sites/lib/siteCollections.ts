import type { SiteCategory } from "@/presentation/sites/view-models/SiteFormViewModel";

/**
 * Registro de colecciones de sitios = landings de /donde-ir/[coleccion].
 * A diferencia de eventos, los "tipos" son un enum fijo → registro estático (sin
 * fetch). Ruta anidada /donde-ir/{slug}-{ciudad} (el detalle vive en /sites/[id],
 * así que no hay colisión; nested es limpio).
 */

export type SiteCollectionKind = "featured" | "all" | "type";

export interface SiteCollectionDef {
  slug: string; // `${baseSlug}-${citySlug}` (param de la ruta)
  kind: SiteCollectionKind;
  citySlug: string;
  cityLabel: string;
  category?: SiteCategory; // solo kind "type"
  shortLabel: string; // chip / heading (ej. "Cafeterías")
  title: string; // H1
  description: string;
  metaTitle: string;
  metaDescription: string;
}

interface City {
  slug: string;
  label: string;
}
export const CITIES: City[] = [{ slug: "ibague", label: "Ibagué" }];

/** Tipo de sitio → slug plural + label. Cubre todos los valores del form. */
const SITE_TYPES: { category: SiteCategory; baseSlug: string; label: string }[] = [
  { category: "restaurant", baseSlug: "restaurantes", label: "Restaurantes" },
  { category: "cafe", baseSlug: "cafeterias", label: "Cafeterías" },
  { category: "bar", baseSlug: "bares", label: "Bares" },
  { category: "discotheque", baseSlug: "discotecas", label: "Discotecas" },
  { category: "mall", baseSlug: "centros-comerciales", label: "Centros comerciales" },
  { category: "park", baseSlug: "parques", label: "Parques" },
  { category: "museum", baseSlug: "museos", label: "Museos" },
  { category: "cultural", baseSlug: "sitios-culturales", label: "Cultural" },
  { category: "viewpoint", baseSlug: "miradores", label: "Miradores" },
  { category: "hostel", baseSlug: "hostales", label: "Hostales" },
  { category: "hotel", baseSlug: "hoteles", label: "Hoteles" },
  { category: "gym", baseSlug: "gimnasios", label: "Gimnasios" },
  { category: "spa", baseSlug: "spas", label: "Spas" },
  { category: "theater", baseSlug: "teatros", label: "Teatros" },
  { category: "other", baseSlug: "otros-sitios", label: "Otros" },
];

/** Todas las colecciones de sitios (destacados + todos + por tipo) × ciudad. */
export function getSiteCollections(): SiteCollectionDef[] {
  const out: SiteCollectionDef[] = [];
  for (const city of CITIES) {
    const c = city.label;
    out.push({
      slug: `destacados-${city.slug}`,
      kind: "featured",
      citySlug: city.slug,
      cityLabel: city.label,
      shortLabel: "Destacados",
      title: `Sitios destacados en ${c}`,
      description: `Los lugares más populares y recomendados en ${c}.`,
      metaTitle: `Sitios destacados en ${c}`,
      metaDescription: `Descubre los mejores lugares de ${c}: cafeterías, bares, restaurantes, parques y más.`,
    });
    out.push({
      slug: `todos-${city.slug}`,
      kind: "all",
      citySlug: city.slug,
      cityLabel: city.label,
      shortLabel: "Todos",
      title: `Todos los sitios en ${c}`,
      description: `Explora todos los lugares de ${c}.`,
      metaTitle: `Todos los sitios y lugares en ${c}`,
      metaDescription: `La guía completa de lugares en ${c}: dónde comer, tomar algo, pasear y más.`,
    });
    for (const t of SITE_TYPES) {
      out.push({
        slug: `${t.baseSlug}-${city.slug}`,
        kind: "type",
        citySlug: city.slug,
        cityLabel: city.label,
        category: t.category,
        shortLabel: t.label,
        title: `${t.label} en ${c}`,
        description: `Descubre ${t.label.toLowerCase()} en ${c}.`,
        metaTitle: `${t.label} en ${c}`,
        metaDescription: `Los mejores ${t.label.toLowerCase()} en ${c}. Encuentra dónde ir cerca de ti.`,
      });
    }
  }
  return out;
}

export function getSiteCollectionBySlug(slug: string): SiteCollectionDef | null {
  return getSiteCollections().find((c) => c.slug === slug) ?? null;
}

/** URL canónica de una colección: /donde-ir-{slug} (raíz, sin subruta). */
export function siteCollectionHref(slug: string): string {
  return `/donde-ir-${slug}`;
}
