import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { SITE_URL } from "@/app/lib/site";
import { getEventCollections } from "@/presentation/events/lib/eventCollections";
import { getSiteCollections } from "@/presentation/sites/lib/siteCollections";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife("hours");
  cacheTag("sitemap");

  const collections = await getEventCollections();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/eventos`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/donde-ir`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
  ];

  const eventLandings: MetadataRoute.Sitemap = collections.map((c) => ({
    url: `${SITE_URL}/${c.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const siteLandings: MetadataRoute.Sitemap = getSiteCollections().map((c) => ({
    url: `${SITE_URL}/donde-ir-${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...eventLandings, ...siteLandings];
}