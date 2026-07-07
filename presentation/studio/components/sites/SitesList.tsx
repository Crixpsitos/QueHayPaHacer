import Link from "next/link";
import Image from "next/image";
import { CalendarRange, ChevronRight, ImageIcon } from "lucide-react";
import type { StudioSiteListItem } from "../../view-models/StudioSitesViewModel";
import { EventsSearchInput } from "../events/EventsSearchInput";
import { EventsLimitSelect } from "../events/EventsLimitSelect";
import { MetricPill } from "./siteMetrics";
import { siteCategoryLabel } from "@/presentation/sites/lib/constants";

interface SitesListProps {
  sites: StudioSiteListItem[];
  limit: number;
  limitOptions: number[];
  /** Valor actual del query param `q` de búsqueda. */
  query: string;
}

export function SitesList({ sites, limit, limitOptions, query }: SitesListProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sitios</h1>
        <p className="mt-1 text-sm text-slate-500">
          Los lugares que agregaste a la plataforma y su desempeño.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <EventsSearchInput query={query} placeholder="Buscar sitio por nombre o categoría…" />
        <EventsLimitSelect limit={limit} options={limitOptions} />
      </div>

      {query && (
        <p className="-mt-2 text-xs text-slate-500">
          Mostrando resultados para{" "}
          <span className="font-medium text-slate-700">«{query}»</span>
        </p>
      )}

      {sites.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-slate-400">
          {query ? "Sin resultados para tu búsqueda." : "Aún no tienes sitios."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sites.map((site) => (
            <Link
              key={site.id}
              href={`/studio/sites/${site.id}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
            >
              <div className="relative aspect-[16/9] w-full bg-slate-100">
                {site.image ? (
                  <Image
                    src={site.image}
                    alt={site.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-slate-300" />
                  </span>
                )}
                <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-700 backdrop-blur">
                  {siteCategoryLabel(site.category)}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <h2 className="font-semibold text-slate-900 group-hover:text-indigo-700">{site.name}</h2>

                {/* Engagement: clicks (alcance) · likes (afinidad) · shares (viralidad) */}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <MetricPill metric="clicks" value={site.clicks} />
                  <MetricPill metric="likes" value={site.likes} />
                  <MetricPill metric="shares" value={site.shares} />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <CalendarRange className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold tabular-nums">{site.eventsCount}</span> eventos
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600">
                    Ver detalle
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
