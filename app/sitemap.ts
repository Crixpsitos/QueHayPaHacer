import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/site";
import { getEventCollections } from "@/presentation/events/lib/eventCollections";

/**
 * Sitemap: home + índice de eventos + todas las landings SEO (una por colección
 * × ciudad). Las URLs son absolutas (SITE_URL). Cacheada por defecto — solo
 * depende de `getEventCollections` (cacheada) y de la fecha.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const collections = await getEventCollections();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/eventos`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
  ];

  const landingRoutes: MetadataRoute.Sitemap = collections.map((c) => ({
    url: `${SITE_URL}/${c.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticRoutes, ...landingRoutes];
}
