"use client";

import Link from "next/link";
import Image from "next/image";
import { CalendarRange, ChevronRight, ImageIcon, MousePointerClick } from "lucide-react";
import type { StudioSiteListItem } from "../../view-models/StudioSitesViewModel";
import { usePagedList } from "../../lib/usePagedList";
import { ListToolbar } from "../shared/ListToolbar";
import { PaginationBar } from "../shared/PaginationBar";

interface SitesListProps {
  sites: StudioSiteListItem[];
}

const formatNumber = (n: number) => n.toLocaleString("es-CO");

export function SitesList({ sites }: SitesListProps) {
  const { query, setQuery, pageSize, setPageSize, page, setPage, paged, pageCount, total, rangeStart, rangeEnd } =
    usePagedList(sites, (s) => `${s.name} ${s.category}`, 9);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sitios</h1>
        <p className="mt-1 text-sm text-slate-500">
          Los lugares que agregaste a la plataforma y su desempeño.
        </p>
      </div>

      <ListToolbar
        query={query}
        onQueryChange={setQuery}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        placeholder="Buscar sitio por nombre o categoría…"
      />

      {total === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-slate-400">
          {query ? "Sin resultados para tu búsqueda." : "Aún no tienes sitios."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paged.map((site) => (
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
                  {site.category}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <h2 className="font-semibold text-slate-900 group-hover:text-indigo-700">{site.name}</h2>

                <div className="mt-3 flex items-center gap-4 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <MousePointerClick className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold tabular-nums">{formatNumber(site.clicks)}</span> clicks
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarRange className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold tabular-nums">{site.eventsCount}</span> eventos
                  </span>
                </div>

                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-indigo-600">
                  Ver detalle
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <PaginationBar
        page={page}
        pageCount={pageCount}
        total={total}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        onPageChange={setPage}
      />
    </div>
  );
}
