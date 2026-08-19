"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { StudioKpiCards } from "./StudioKpiCards";
import { TopEventsRanking } from "./TopEventsRanking";
import type { StudioOverviewViewModel } from "../../view-models/StudioOverviewViewModel";

// Recharts no soporta SSR limpio → siempre vía dynamic con ssr: false.
const chartLoader = () => (
  <div className="flex h-[300px] w-full animate-pulse items-center justify-center rounded-lg bg-gray-100 text-sm text-slate-400">
    Cargando gráfica…
  </div>
);

const ViewsRegistrationsChart = dynamic(
  () => import("../charts/ViewsRegistrationsChart"),
  { ssr: false, loading: chartLoader },
);
const RegistrationsTimelineChart = dynamic(() => import("../charts/RegistrationsTimelineChart"), {
  ssr: false,
  loading: chartLoader,
});
const InteractivityChart = dynamic(() => import("../charts/InteractivityChart"), {
  ssr: false,
  loading: chartLoader,
});

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <header className="mb-4">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

interface StudioOverviewProps {
  data: StudioOverviewViewModel;
}

export function StudioOverview({ data }: StudioOverviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Estudio del Organizador
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Gestiona tus eventos y conoce a tu audiencia.
        </p>
      </div>

      <StudioKpiCards kpis={data.kpis} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.85fr_0.95fr]">
        <Panel
          title="Vistas y registros por evento"
          subtitle="Comparativa de desempeño entre tus eventos"
        >
          <ViewsRegistrationsChart data={data.viewsVsRegistrations} />
        </Panel>
        <Panel
          title="Eventos más populares"
          subtitle="Ranking por puntuación de rendimiento (más alta = más recomendado)"
        >
          <TopEventsRanking events={data.topEvents} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.85fr_0.95fr]">
        <Panel
          title="Inscripciones en el tiempo"
          subtitle="Registros diarios de todos tus eventos este mes"
        >
          <RegistrationsTimelineChart data={data.registrationsTimeline} />
        </Panel>
        <Panel title="Interactividad" subtitle="Vistas, likes y compartidos por evento">
          <InteractivityChart data={data.interactivity} />
        </Panel>
      </div>
    </div>
  );
}
