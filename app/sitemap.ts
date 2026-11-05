import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { SITE_URL } from "@/app/lib/site";
import { getEventCollections } from "@/presentation/events/lib/eventCollections";
import { getSiteCollections } from "@/presentation/sites/lib/siteCollections";
import { createServerContainer } from "@/infraestructure/di/container";
import { fetchEventSessions } from "@/presentation/events/data/eventDetailFetchers";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife("hours");
  // Se refresca con las mismas invalidaciones de los listados (alta/baja de sitios y eventos).
  cacheTag("sitemap", "site-list", "event-list");

  const collections = await getEventCollections();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/eventos`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/donde-ir`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/explorar`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/contactanos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/premium`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/terminos`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
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

  // Fichas individuales (lo que más conviene indexar). Si Firestore falla, el sitemap sale igual con las fijas.
  let details: MetadataRoute.Sitemap = [];
  let sessionEntries: MetadataRoute.Sitemap = [];
  try {
    const { sitesService, eventsService } = createServerContainer();
    const [sites, events] = await Promise.all([sitesService.getSitemapEntries(), eventsService.getSitemapEntries()]);
    details = [
      ...sites.filter((s) => s.slug).map((s) => ({
        url: `${SITE_URL}/donde-ir/${s.slug}`,
        lastModified: s.updatedAt ?? undefined,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...events.map((e) => ({
        url: `${SITE_URL}/eventos/${e.slug || e.id}`,
        lastModified: e.updatedAt ?? undefined,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
    ];

    // Cada fecha de un evento multi-fecha es una página propia (fecha y lugar propios).
    const multi = events.filter((e) => e.eventType === "multi-date");
    const perEvent = await Promise.all(
      multi.map(async (e) => {
        const sessions = await fetchEventSessions(e.id).catch(() => []);
        return sessions
          .filter((s) => s.status === "published")
          .map((s) => ({
            url: `${SITE_URL}/eventos/${e.slug || e.id}/sessions/${s.slug || s.id}`,
            changeFrequency: "daily" as const,
            priority: 0.6,
          }));
      }),
    );
    sessionEntries = perEvent.flat();
  } catch (error) {
    console.error("[sitemap] no se pudieron leer las fichas", error);
  }

  return [...staticRoutes, ...eventLandings, ...siteLandings, ...details, ...sessionEntries];
}