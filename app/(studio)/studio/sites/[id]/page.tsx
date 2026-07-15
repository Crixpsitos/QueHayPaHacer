import { notFound } from "next/navigation";
import { SiteDetail } from "@/presentation/studio/components/sites/SiteDetail";
import type {
  SiteDetailViewModel,
  SiteEventItem,
} from "@/presentation/studio/view-models/StudioSitesViewModel";
import type { SiteAnalytics, SiteEventsPage } from "@/domain/entities/studio/Studio";
import { createServerContainer } from "@/infraestructure/di/container";
import { cacheLife, cacheTag } from "next/cache";

// ponytail: en dev, page size 1 por defecto (+opción en el select) para probar
// la paginación del itinerario con pocos eventos. En prod arranca en 20.
const IS_DEV = process.env.NODE_ENV !== "production";
const LIMIT_OPTIONS = IS_DEV ? [1, 10, 20, 50] : [10, 20, 50];
const DEFAULT_LIMIT = IS_DEV ? 1 : 20;

// Cacheado por siteId (estable): no depende de la búsqueda/paginación de eventos.
async function getCachedSiteAnalytics(siteId: string): Promise<SiteAnalytics | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`site-${siteId}`);
  const { studioService } = createServerContainer();
  return studioService.getSiteAnalytics(siteId);
}

// Cacheado por (siteId, search, cursor, direction): itinerario con búsqueda +
// paginación por cursor, todo SERVER-SIDE en el pipeline.
async function getCachedSiteEvents(
  siteId: string,
  search: string | undefined,
  cursor: string | undefined,
  direction: "next" | "prev",
  limit: number,
): Promise<SiteEventsPage> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`site-${siteId}`);
  const { studioService } = createServerContainer();
  return studioService.getEventsBySite(siteId, { search, cursor, direction, limit });
}

function toViewModel(
  analytics: SiteAnalytics,
  page: SiteEventsPage,
  limit: number,
): SiteDetailViewModel {
  return {
    id: analytics.siteId,
    name: analytics.name,
    category: analytics.category,
    image: analytics.image,
    totalClicks: analytics.totalClicks,
    totalLikes: analytics.totalLikes,
    totalShares: analytics.totalShares,
    interactionsOverTime: analytics.interactionsOverTime.map((p) => ({
      date: p.weekStart,
      clicks: p.clicks,
      likes: p.likes,
      shares: p.shares,
    })),
    eventsCount: analytics.eventsCount,
    events: page.events.map<SiteEventItem>((e) => ({
      eventId: e.eventId,
      name: e.name,
      date: e.date ? e.date.toISOString() : null,
      status: e.status,
      image: e.image,
      views: e.views,
      registrations: e.registrations,
    })),
    eventsNextCursor: page.nextCursor,
    eventsPrevCursor: page.prevCursor,
    eventsLimit: limit,
    eventsLimitOptions: LIMIT_OPTIONS,
  };
}

interface SiteDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; cursor?: string; direction?: string; limit?: string }>;
}

export default async function SiteDetailPage({ params, searchParams }: SiteDetailPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const search = sp.q?.trim() || undefined;
  const direction = sp.direction === "prev" ? "prev" : "next";
  const limit = LIMIT_OPTIONS.includes(Number(sp.limit)) ? Number(sp.limit) : DEFAULT_LIMIT;

  // Analíticas (por siteId) y eventos (por siteId+search+cursor+limit) en paralelo.
  // Buscar o paginar solo re-consulta los eventos; las analíticas salen de cache.
  const [analytics, page] = await Promise.all([
    getCachedSiteAnalytics(id),
    getCachedSiteEvents(id, search, sp.cursor, direction, limit),
  ]);
  if (!analytics) notFound();

  return <SiteDetail site={toViewModel(analytics, page, limit)} query={search ?? ""} />;
}
