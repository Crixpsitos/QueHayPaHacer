import { cacheLife, cacheTag } from "next/cache";
import { getEnterpriseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { Pipelines } from "@google-cloud/firestore";
import { fetchEventDetailById } from "./eventDetailFetchers";
import { getCategoryEventsPage } from "./categoryEventsPage";
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper";
import { createServerContainer } from "@/infraestructure/di/container";
import { CategoryViewModelMapper } from "@/presentation/categories/mapper/CategoryViewModelMapper";
import type { EventViewModel } from "@/presentation/events/view-models/EventViewModel";
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel";
import type { Events } from "@/domain/entities/events/Events";
import type { SiteCategory } from "@/presentation/sites/view-models/SiteFormViewModel";

const { field, documentMatches, score, or: pipelineOr } = Pipelines;

export const EXPLORE_PAGE_SIZE = 12;



export interface ExploreFilters {
  free?: boolean;
  promoted?: boolean;
  multiDate?: boolean;
  maxPrice?: number;
  onlyEvents?: boolean;
  onlySites?: boolean;
}

export interface ExploreSearchData {
  events: EventViewModel[];
  sites: SiteDetail[];
  total: number;
  hasMoreEvents: boolean;
  hasMoreSites: boolean;
}

export interface ExploreBrowseEventSection {
  categoryId: string;
  title: string;
  icon: string;
  events: EventViewModel[];
  nextCursor: string | null;
}

export interface ExploreBrowseSiteSection {
  category: SiteCategory;
  label: string;
  collectionSlug: string;
  sites: SiteDetail[];
  nextCursor: string | null;
}

export interface ExploreBrowseData {
  eventSections: ExploreBrowseEventSection[];
  siteSections: ExploreBrowseSiteSection[];
}

// ── Browse (sin búsqueda) ────────────────────────────────────────────────────

const BROWSE_SECTION_SIZE = 8;
const BROWSE_SITE_CATEGORIES: { category: SiteCategory; label: string; slug: string }[] = [
  { category: "restaurant", label: "Restaurantes", slug: "restaurantes-ibague" },
  { category: "cafe",       label: "Cafeterías",   slug: "cafeterias-ibague" },
  { category: "bar",        label: "Bares",        slug: "bares-ibague" },
  { category: "park",       label: "Parques",      slug: "parques-ibague" },
  { category: "museum",     label: "Museos",       slug: "museos-ibague" },
  { category: "cultural",   label: "Cultural",     slug: "sitios-culturales-ibague" },
  { category: "theater",    label: "Teatros",      slug: "teatros-ibague" },
  { category: "hotel",      label: "Hoteles",      slug: "hoteles-ibague" },
];
/** Detalle de un sitio — cacheado por id. Reemplaza la importación de data/siteFetchers. */
const fetchSiteDetailById = async (id: string): Promise<SiteDetail | null> => {
  "use cache";
  cacheLife("weeks");
  cacheTag(`site-${id}`);
  const { sitesService } = createServerContainer();
  return sitesService.getSiteDetailById(id);
};

/** Una página de sitios por categoría con cursor. Reemplaza la importación de data/siteCategoryPage. */
const getSiteCategoryPage = async (
  category: SiteCategory,
  cursor: string | null,
  limit = 8,
): Promise<{ sites: SiteDetail[]; nextCursor: string | null }> => {
  "use cache";
  cacheLife("days");
  cacheTag("site-list", `site-type-${category}`);
  const { sitesService } = createServerContainer();
  const { ids, nextCursor } = await sitesService.getSitesByCategory(category as string, limit, cursor);
  const sites = (await Promise.all(ids.map(fetchSiteDetailById))).filter(
    (s): s is SiteDetail => Boolean(s),
  );
  return { sites, nextCursor };
};

export { fetchSiteDetailById, getSiteCategoryPage };
export const fetchActiveCategories = async () => {
  "use cache";
  cacheLife("days");
  cacheTag("active-categories");
  const { categoriesService } = createServerContainer();
  const cats = await categoriesService.getActiveCategories();
  return cats.map(CategoryViewModelMapper.toViewModel);
};

export async function fetchBrowseData(): Promise<ExploreBrowseData> {
  "use cache";
  cacheLife("hours");
  cacheTag("explore", "event-list", "site-list");

  const categories = await fetchActiveCategories();

  const [eventResults, siteResults] = await Promise.all([
    Promise.all(
      categories.map(async (cat) => {
        const { events, nextCursor } = await getCategoryEventsPage(cat.id, null, BROWSE_SECTION_SIZE);
        return { categoryId: cat.id, title: cat.title, icon: cat.icon, events, nextCursor };
      }),
    ),
    Promise.all(
      BROWSE_SITE_CATEGORIES.map(async ({ category, label, slug }) => {
        const { sites, nextCursor } = await getSiteCategoryPage(category, null, BROWSE_SECTION_SIZE);
        return { category, label, collectionSlug: slug, sites, nextCursor };
      }),
    ),
  ]);

  const eventSections: ExploreBrowseEventSection[] = eventResults
    .filter((s) => s.events.length > 0)
    .map((s) => ({
      ...s,
      events: s.events.map((e) => EventViewModelMapper.toViewModel(e)),
    }));

  const siteSections: ExploreBrowseSiteSection[] = siteResults.filter(
    (s) => s.sites.length > 0,
  );

  return { eventSections, siteSections };
}

// ── Búsqueda (con query o fechas) ─────────────────────────────────────────────

export async function fetchExploreResults(
  q: string,
  from?: string,
  to?: string,
  page = 0,
  filters: ExploreFilters = {},
): Promise<ExploreSearchData> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 120, expire: 600 });
  cacheTag("explore", "event-list");

  const db = getEnterpriseFirestore();
  const trimmed = q.trim();
  // Append T00:00:00 (no Z) so Date() interprets as local server time, not UTC midnight
  const fromDate = from ? new Date(`${from}T00:00:00`) : undefined;
  const toDate   = to   ? new Date(`${to}T00:00:00`)   : undefined;
  const now = new Date();

  const [eventIds, siteIds] = await Promise.all([
    filters.onlySites
      ? Promise.resolve([] as string[])
      : fetchEvents(db, trimmed, fromDate, toDate, now, page, filters),
    !filters.onlyEvents && trimmed && page === 0
      ? fetchSiteIds(db, trimmed, filters).catch((err) => {
          console.warn("[explore] sites search index not ready:", (err as Error).message);
          return [] as string[];
        })
      : Promise.resolve([] as string[]),
  ]);

  const [eventDetails, siteDetails] = await Promise.all([
    Promise.all(eventIds.slice(0, EXPLORE_PAGE_SIZE).map(fetchEventDetailById)),
    Promise.all(siteIds.slice(0, EXPLORE_PAGE_SIZE).map(fetchSiteDetailById)),
  ]);

  const events = eventDetails
    .filter((e): e is Events => Boolean(e) && e!.status === "published")
    .map((e) => EventViewModelMapper.toViewModel(e!));

  const sites = siteDetails.filter((s): s is SiteDetail => Boolean(s));

  return {
    events,
    sites,
    total: events.length + sites.length,
    hasMoreEvents: eventIds.length > EXPLORE_PAGE_SIZE,
    hasMoreSites: false, // los sitios se muestran solo en la primera página
  };
}

// ── IDs de Eventos ────────────────────────────────────────────────────────────

async function fetchEvents(
  db: FirebaseFirestore.Firestore,
  q: string,
  from?: Date,
  to?: Date,
  now?: Date,
  page = 0,
  filters: ExploreFilters = {},
): Promise<string[]> {
  const collection = db.pipeline().collection("events");

  let stage = q
    ? collection
        .search({ query: documentMatches(q), sort: score().descending() })
        .where(field("status").equal("published"))
    : collection.where(field("status").equal("published"));

  if (from) {
    stage = stage.where(field("startDate").greaterThanOrEqual(from));
  } else if (now) {
    stage = stage.where(field("endDate").greaterThanOrEqual(now));
  }

  if (to) {
    // Exclusive next-day boundary covers the full day regardless of timezone
    const toExclusive = new Date(to);
    toExclusive.setDate(toExclusive.getDate() + 1);
    stage = stage.where(field("startDate").lessThan(toExclusive));
  }

  // Filtros adicionales
  if (filters.free) {
    // Multi-date events don't have event-level prices; exclude them from price filters
    stage = stage
      .where(field("price.isFree").equal(true))
      .where(field("eventType").notEqual("multi-date"));
  } else if (filters.maxPrice && filters.maxPrice > 0) {
    stage = stage
      .where(
        pipelineOr(
          field("price.isFree").equal(true),
          field("price.amount").lessThanOrEqual(filters.maxPrice),
        ),
      )
      .where(field("eventType").notEqual("multi-date"));
  }

  if (filters.promoted) {
    stage = stage.where(
      pipelineOr(
        field("promotion.isPromoted").equal(true),
        field("analytics.score").greaterThanOrEqual(15),
      ),
    );
  }

  if (filters.multiDate) {
    stage = stage.where(field("eventType").equal("multi-date"));
  }

  // Sort chronologically when no text query; text search already sorts by score
  if (!q) {
    stage = stage.sort(field("startDate").ascending());
  }

  const result = await stage
    .offset(page * EXPLORE_PAGE_SIZE)
    .limit(EXPLORE_PAGE_SIZE + 1)
    .execute();

  return result.results.map((r) => r.ref?.id ?? "").filter(Boolean);
}

// ── IDs de Sitios ─────────────────────────────────────────────────────────────

async function fetchSiteIds(
  db: FirebaseFirestore.Firestore,
  q: string,
  filters: ExploreFilters = {},
): Promise<string[]> {
  let stage = db
    .pipeline()
    .collection("sites")
    .search({ query: documentMatches(q), sort: score().descending() })
    .where(field("publicationStatus").equal("published"))
    .where(field("moderationStatus").equal("approved"))
    .where(field("isActive").equal(true));

  if (filters.promoted) {
    stage = stage.where(field("analytics.score").greaterThanOrEqual(20));
  }

  const result = await stage.limit(EXPLORE_PAGE_SIZE).execute();
  return result.results.map((r) => r.ref?.id ?? "").filter(Boolean);
}

