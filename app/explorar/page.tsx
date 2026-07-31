import type { Metadata } from "next";
import Link from "next/link";
import { Compass, ArrowRight } from "lucide-react";
import { Section } from "@/app/components/layout/shared/Section";
import { Separator } from "@/app/components/ui/separator";
import { ServerBoundary } from "@/presentation/shared/components/ServerBoundary";
import { ExploreSearchBar } from "@/app/components/feature/home/ExploreSearchBar";
import { InfiniteExploreSearch } from "@/app/components/feature/explore/InfiniteExploreSearch";
import { InfiniteSiteCategoryList } from "@/app/components/feature/explore/InfiniteSiteCategoryList";
import { InfiniteEventList } from "@/presentation/events/components/InfiniteEventList";
import {
  fetchExploreResults,
  fetchBrowseData,
  fetchActiveCategories,
  type ExploreBrowseEventSection,
  type ExploreBrowseSiteSection,
  type ExploreFilters,
} from "@/presentation/events/data/exploreFetchers";
import {
  CATEGORY_ICON_MAP,
  CATEGORY_COLOR_MAP,
  CATEGORY_FALLBACK_COLOR,
} from "@/presentation/categories/lib/categoryIconMap";
import type { EventViewModel } from "@/presentation/events/view-models/EventViewModel";
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel";
import type { SiteCategory } from "@/presentation/sites/view-models/SiteFormViewModel";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const metadata: Metadata = {
  title: "Explorar — Que Hay Pa Hacer?",
  description: "Descubre eventos y lugares en Ibagué.",
  alternates: { canonical: "/explorar" },
};

interface ExplorarSearchParams {
  q?: string;
  from?: string;
  to?: string;
  free?: string;
  promoted?: string;
  type?: string;
  maxPrice?: string;
}

export default function ExplorarPage({
  searchParams,
}: {
  searchParams: Promise<ExplorarSearchParams>;
}) {
  return (
    <ServerBoundary<never, ExplorarSearchParams>
      searchParams={searchParams}
      fallback={<ExplorarSkeleton />}
    >
      {({ searchParams: sp }) => <ExplorarContent sp={sp} />}
    </ServerBoundary>
  );
}

// ── Contenido principal ───────────────────────────────────────────────────────

async function ExplorarContent({ sp }: { sp: ExplorarSearchParams }) {
  const q = sp.q?.trim() ?? "";
  const from = sp.from;
  const to = sp.to;
  const filters: ExploreFilters = {
    free: sp.free === "1",
    promoted: sp.promoted === "1",
    multiDate: sp.type === "multi-date",
    maxPrice: sp.maxPrice ? parseInt(sp.maxPrice, 10) : undefined,
  };
  const isSearch = Boolean(q || from || filters.free || filters.promoted || filters.multiDate || filters.maxPrice);

  // Siempre cargamos el browse: da las categorías con íconos y eventos base
  const [browseData, categories] = await Promise.all([
    fetchBrowseData(),
    fetchActiveCategories(),
  ]);

  // Mapa categoría id → metadatos (para enriquecer resultados de búsqueda)
  const catById = Object.fromEntries(categories.map((c) => [c.id, c]));

  let eventSections: ExploreBrowseEventSection[] = browseData.eventSections;
  let siteSections: ExploreBrowseSiteSection[] = browseData.siteSections;
  let searchTotal = 0;
  let hasMoreEvents = false;

  if (isSearch) {
    const data = await fetchExploreResults(q, from, to, 0, filters);
    searchTotal = data.total;
    hasMoreEvents = data.hasMoreEvents;

    // Agrupar eventos por categoría para mantener el mismo layout de secciones
    const grouped: Record<string, EventViewModel[]> = {};
    for (const ev of data.events) {
      const id = ev.categoryInfo?.id ?? "other";
      grouped[id] = grouped[id] ?? [];
      grouped[id].push(ev);
    }

    // Secciones de búsqueda solo con categorías que tienen resultados
    eventSections = Object.entries(grouped).map(([catId, events]) => {
      const cat = catById[catId];
      return {
        categoryId: catId,
        title: cat?.title ?? "Otros",
        icon: cat?.icon ?? "other",
        events,
        nextCursor: null,
      };
    });

    // Sitios agrupados por categoría
    const siteGrouped: Record<string, SiteDetail[]> = {};
    for (const site of data.sites) {
      const cat = site.category as string;
      siteGrouped[cat] = siteGrouped[cat] ?? [];
      siteGrouped[cat].push(site);
    }

    const SITE_LABELS: Record<string, string> = {
      restaurant: "Restaurantes", cafe: "Cafeterías", bar: "Bares",
      discotheque: "Discotecas", mall: "Centros comerciales", park: "Parques",
      museum: "Museos", cultural: "Cultural", viewpoint: "Miradores",
      hostel: "Hostales", hotel: "Hoteles", gym: "Gimnasios",
      spa: "Spas", theater: "Teatros", other: "Otros sitios",
    };

    siteSections = Object.entries(siteGrouped).map(([cat, sites]) => ({
      category: cat as SiteCategory,
      label: SITE_LABELS[cat] ?? cat,
      collectionSlug: `${cat}-ibague`,
      sites,
      nextCursor: null,
    }));
  }

  return (
    <Section spacing="sm" className="mt-6 min-h-[60vh]">
      {/* Header + buscador */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center gap-2">
          <Compass className="size-6 text-primary" />
          <h1 className="text-2xl font-bold sm:text-3xl">Explorar</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Busca por texto y/o fechas, o descubre por categorías.
        </p>
        <ExploreSearchBar
          key={`${q}-${from ?? ""}-${to ?? ""}-${filters.free}-${filters.promoted}-${filters.multiDate}-${filters.maxPrice ?? ""}`}
          initialQuery={q}
          initialFrom={from}
          initialTo={to}
          initialFree={filters.free}
          initialPromoted={filters.promoted}
          initialMultiDate={filters.multiDate}
          initialMaxPrice={filters.maxPrice}
        />
      </div>

      {/* Contador de búsqueda */}
      {isSearch && (
        <div className="mb-6">
          <p className="text-sm font-medium text-muted-foreground">
            <span className="text-xl font-bold text-foreground">{searchTotal}</span>{" "}
            resultado{searchTotal !== 1 ? "s" : ""} por descubrir
            {q && <> para <span className="font-semibold text-foreground">&ldquo;{q}&rdquo;</span></>}
            {from && <> desde <span className="font-semibold text-foreground">{format(new Date(from), "d MMM yyyy", { locale: es })}</span></>}
            {to && <> hasta <span className="font-semibold text-foreground">{format(new Date(to), "d MMM yyyy", { locale: es })}</span></>}
          </p>
          {searchTotal === 0 && (
            <div className="mt-4 rounded-2xl border border-dashed border-border py-12 text-center">
              <p className="text-sm font-medium text-muted-foreground">No encontramos nada para esta búsqueda.</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Prueba con otras palabras o amplía el rango de fechas.</p>
            </div>
          )}
        </div>
      )}

      {/* Secciones de eventos por categoría */}
      {eventSections.length > 0 && (
        <div className="space-y-12">
          {eventSections.map((section, idx) => (
            <EventCategorySection
              key={section.categoryId}
              section={section}
              isSearch={isSearch}
              isLast={idx === eventSections.length - 1 && siteSections.length === 0}
              q={q} from={from} to={to}
              filters={filters}
              hasMoreEvents={hasMoreEvents}
            />
          ))}
        </div>
      )}

      {/* Secciones de sitios */}
      {siteSections.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-8 text-xl font-bold">Lugares en la ciudad</h2>
          <div className="space-y-12">
            {siteSections.map((section) => (
              <div key={section.category}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{section.label}</h3>
                  {!isSearch && (
                    <Link href={`/donde-ir-${section.collectionSlug}`}
                      className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                      Ver todos <ArrowRight className="size-4" />
                    </Link>
                  )}
                </div>
                <InfiniteSiteCategoryList
                  category={section.category}
                  initialSites={section.sites}
                  initialCursor={section.nextCursor}
                />
                <Separator className="mt-12" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!isSearch && eventSections.length === 0 && siteSections.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Compass className="size-14 text-muted-foreground/20" />
          <p className="text-base font-medium text-muted-foreground">
            Todavía no hay contenido disponible. ¡Vuelve pronto!
          </p>
        </div>
      )}
    </Section>
  );
}

// ── Sección de categoría de evento ────────────────────────────────────────────

function EventCategorySection({
  section,
  isSearch,
  isLast,
  q, from, to,
  filters,
  hasMoreEvents,
}: {
  section: ExploreBrowseEventSection;
  isSearch: boolean;
  isLast: boolean;
  q: string;
  from?: string;
  to?: string;
  filters: ExploreFilters;
  hasMoreEvents: boolean;
}) {
  const Icon = CATEGORY_ICON_MAP[section.icon] ?? CATEGORY_ICON_MAP.music;
  const color = CATEGORY_COLOR_MAP[section.icon] ?? CATEGORY_FALLBACK_COLOR;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex size-9 items-center justify-center rounded-xl ${color.bg}`}>
            <Icon className={`size-5 ${color.icon}`} />
          </div>
          <h2 className="text-lg font-semibold">{section.title}</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {section.events.length}
          </span>
        </div>
        {!isSearch && (
          <Link
            href={`/eventos?categoria=${section.categoryId}`}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver todos <ArrowRight className="size-4" />
          </Link>
        )}
      </div>

      {isSearch ? (
        <InfiniteExploreSearch
          q={q} from={from} to={to}
          filters={filters}
          initialEvents={section.events}
          initialHasMore={isLast && hasMoreEvents}
        />
      ) : (
        <InfiniteEventList
          categoryId={section.categoryId}
          initialEvents={section.events}
          initialCursor={section.nextCursor}
          initialLikedByEventId={{}}
        />
      )}
      <Separator className="mt-12" />
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function ExplorarSkeleton() {
  return (
    <Section spacing="sm" className="mt-6">
      <div className="mb-8 space-y-4">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-11 w-full animate-pulse rounded-2xl bg-muted" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="mb-12">
          <div className="mb-4 flex items-center gap-3">
            <div className="size-9 animate-pulse rounded-xl bg-muted" />
            <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-48 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        </div>
      ))}
    </Section>
  );
}
