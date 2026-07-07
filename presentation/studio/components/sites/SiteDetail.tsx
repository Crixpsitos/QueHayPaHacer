"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ArrowLeft, ImageIcon } from "lucide-react";
import type { SiteDetailViewModel } from "../../view-models/StudioSitesViewModel";
import { SiteEventsList } from "./SiteEventsList";
import { MetricCard } from "./siteMetrics";
import { siteCategoryLabel } from "@/presentation/sites/lib/constants";

const InteractionsOverTimeChart = dynamic(() => import("../charts/InteractionsOverTimeChart"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[260px] w-full animate-pulse items-center justify-center rounded-lg bg-gray-100 text-sm text-slate-400">
      Cargando gráfica…
    </div>
  ),
});

interface SiteDetailProps {
  site: SiteDetailViewModel;
  /** Valor actual del query param `q` (búsqueda server-side del itinerario). */
  query: string;
}

export function SiteDetail({ site, query }: SiteDetailProps) {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/studio/sites"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Sitios
        </Link>

        <div className="mt-3 flex items-center gap-4">
          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-slate-100">
            {site.image ? (
              <Image src={site.image} alt={site.name} fill sizes="56px" className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-5 w-5 text-slate-300" />
              </span>
            )}
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{site.name}</h1>
            <span className="mt-1 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {siteCategoryLabel(site.category)}
            </span>
          </div>
        </div>
      </div>

      {/* Fila KPI: engagement completo del sitio */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard metric="clicks" value={site.totalClicks} />
        <MetricCard metric="likes" value={site.totalLikes} />
        <MetricCard metric="shares" value={site.totalShares} />
        <MetricCard metric="events" value={site.eventsCount} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        {/* Interacciones (engagement) en el tiempo: clicks + likes + shares apilados */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <header className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Interacciones en el tiempo</h2>
            <p className="mt-0.5 text-xs text-slate-400">Clicks, me gusta y compartidos por semana</p>
          </header>
          <InteractionsOverTimeChart data={site.interactionsOverTime} />
        </div>

        {/* Eventos en este sitio */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <SiteEventsList
            siteId={site.id}
            events={site.events}
            query={query}
            limit={site.eventsLimit}
            limitOptions={site.eventsLimitOptions}
            nextCursor={site.eventsNextCursor}
            prevCursor={site.eventsPrevCursor}
          />
        </div>
      </div>
    </div>
  );
}
