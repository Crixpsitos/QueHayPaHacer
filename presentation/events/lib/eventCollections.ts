import { cacheLife, cacheTag } from "next/cache";
import { createServerContainer } from "@/infraestructure/di/container";

/**
 * Registro de "colecciones" de eventos = las landings SEO top-level.
 *
 * El slug es `eventos-${baseSlug}-${citySlug}` (ej. `eventos-destacados-ibague`,
 * `eventos-musica-ibague`) y la ruta es top-level (`/eventos-musica-ibague`). Se
 * eligió top-level porque `/eventos/[coleccion]` colisiona con el detalle
 * `/eventos/[id]` (mismo segmento), y además la keyword al inicio es mejor SEO.
 * Se resuelve por lookup, NO partiendo el string por guiones (los baseSlug tienen
 * guiones, ej. `este-fin-de-semana`).
 *
 * Ciudad: hoy solo Ibagué, pero `CITIES` es un array → agregar una ciudad el día
 * de mañana regenera todas las combinaciones sin tocar el resto.
 */

export type CollectionKind = "featured" | "weekend" | "category";

export interface CollectionDef {
  /** Slug completo de la ruta: `${baseSlug}-${citySlug}`. */
  slug: string;
  kind: CollectionKind;
  citySlug: string;
  cityLabel: string;
  /** Solo para kind "category": el `id` de la categoría (docId). */
  categoryId?: string;
  /**
   * Solo para kind "category": el slug de la categoría. Se filtra por `id` O `slug`
   * porque los eventos guardan `categoryInfo.id` inconsistente (unos el docId, otros
   * el slug — datos de seed viejos). Matchear por ambos los captura todos.
   */
  categorySlug?: string;
  /** Nombre corto para chips/tabs (ej. "Destacados", "Música"). */
  shortLabel: string;
  /** H1 de la landing. */
  title: string;
  /** Texto introductorio bajo el H1. */
  description: string;
  /** <title> SEO. */
  metaTitle: string;
  /** meta description SEO. */
  metaDescription: string;
}

interface City {
  slug: string;
  label: string;
}

/** Ciudades cubiertas. Escalable: agregar aquí genera nuevas landings. */
export const CITIES: City[] = [{ slug: "ibague", label: "Ibagué" }];

/** Colecciones base (no dependen de datos): destacados y fin de semana. */
const BASE_COLLECTIONS: {
  baseSlug: string;
  kind: Exclude<CollectionKind, "category">;
  shortLabel: string;
  title: (city: string) => string;
  description: (city: string) => string;
  metaTitle: (city: string) => string;
  metaDescription: (city: string) => string;
}[] = [
  {
    baseSlug: "destacados",
    kind: "featured",
    shortLabel: "Destacados",
    title: (c) => `Eventos destacados en ${c}`,
    description: (c) =>
      `Los eventos más populares y recomendados en ${c}: conciertos, cultura, gastronomía y más.`,
    metaTitle: (c) => `Eventos destacados en ${c} | Que Hay Pa Hacer?`,
    metaDescription: (c) =>
      `Descubre los eventos más destacados y populares en ${c}. Encuentra los mejores planes cerca de ti.`,
  },
  {
    baseSlug: "este-fin-de-semana",
    kind: "weekend",
    shortLabel: "Este fin de semana",
    title: (c) => `Eventos este fin de semana en ${c}`,
    description: (c) =>
      `Planes para este fin de semana en ${c}. No te quedes sin qué hacer.`,
    metaTitle: (c) => `Qué hacer este fin de semana en ${c} | Que Hay Pa Hacer?`,
    metaDescription: (c) =>
      `Los mejores eventos y planes para este fin de semana en ${c}. Conciertos, ferias, cultura y más.`,
  },
];

const fetchActiveCategories = async () => {
  "use cache";
  cacheLife({ stale: 300, revalidate: 120, expire: 600 });
  cacheTag("active-categories");
  const { categoriesService } = createServerContainer();
  return categoriesService.getActiveCategories();
};

/**
 * Todas las colecciones (base × ciudad + categoría × ciudad). Cacheada porque
 * depende de las categorías activas. La usan `generateStaticParams`,
 * `generateMetadata` y la página.
 */
export async function getEventCollections(): Promise<CollectionDef[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 120, expire: 600 });
  cacheTag("active-categories");

  const categories = await fetchActiveCategories();
  const out: CollectionDef[] = [];

  for (const city of CITIES) {
    for (const base of BASE_COLLECTIONS) {
      out.push({
        slug: `eventos-${base.baseSlug}-${city.slug}`,
        kind: base.kind,
        citySlug: city.slug,
        cityLabel: city.label,
        shortLabel: base.shortLabel,
        title: base.title(city.label),
        description: base.description(city.label),
        metaTitle: base.metaTitle(city.label),
        metaDescription: base.metaDescription(city.label),
      });
    }

    for (const cat of categories) {
      out.push({
        slug: `eventos-${cat.slug}-${city.slug}`,
        kind: "category",
        citySlug: city.slug,
        cityLabel: city.label,
        categoryId: cat.id,
        categorySlug: cat.slug,
        shortLabel: cat.title,
        title: `Eventos de ${cat.title} en ${city.label}`,
        description: `Descubre los mejores eventos de ${cat.title} en ${city.label}.`,
        metaTitle: `Eventos de ${cat.title} en ${city.label} | Que Hay Pa Hacer?`,
        metaDescription: `Agenda de eventos de ${cat.title} en ${city.label}. Encuentra fechas, lugares y entradas.`,
      });
    }
  }

  return out;
}

export async function getEventCollectionBySlug(
  slug: string,
): Promise<CollectionDef | null> {
  const collections = await getEventCollections();
  return collections.find((c) => c.slug === slug) ?? null;
}
