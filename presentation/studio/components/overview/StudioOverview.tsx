"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { cn } from "@/app/lib/utils/cn";
import { StudioKpiCards } from "./StudioKpiCards";
import { TopEventsRanking } from "./TopEventsRanking";
import { ConversionRanking } from "./ConversionRanking";
import { InteractivityTable } from "./InteractivityTable";
import { buildNextSteps } from "./nextSteps";
import { CHART } from "../charts/chartTheme";
import type { StudioOverviewViewModel } from "../../view-models/StudioOverviewViewModel";

// Recharts no soporta SSR limpio → siempre vía dynamic con ssr: false.
const RegistrationsTimelineChart = dynamic(() => import("../charts/RegistrationsTimelineChart"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[260px] w-full animate-pulse items-center justify-center rounded-lg bg-zinc-50 text-sm text-zinc-400">
      Cargando gráfica…
    </div>
  ),
});

function Panel({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border border-zinc-200 bg-white p-4 sm:p-5", className)}>
      <header className="mb-4">
        <h2 className="font-heading text-base font-semibold text-zinc-950">{title}</h2>
        <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
      </header>
      {children}
    </section>
  );
}

interface StudioOverviewProps {
  data: StudioOverviewViewModel;
}

export function StudioOverview({ data }: StudioOverviewProps) {
  const nextSteps = buildNextSteps(data);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-zinc-950">
          Tu estudio
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Gestiona tus eventos y conoce a tu audiencia.
        </p>
      </div>

      <StudioKpiCards kpis={data.kpis} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Panel
          className="lg:col-span-8"
          title="¿Qué eventos convierten mejor?"
          subtitle="Inscritos ÷ vistas en tus 10 eventos publicados más vistos (sin registro externo), desde su publicación"
        >
          <ConversionRanking rows={data.conversion} />
        </Panel>
        <Panel
          className="lg:col-span-4"
          title="Eventos con mejor rendimiento"
          subtitle="Top 5 por puntuación (0–150) entre los creados el mes pasado y este mes"
        >
          <TopEventsRanking events={data.topEvents} />
        </Panel>

        <Panel
          className="lg:col-span-12"
          title="Inscripciones por día"
          subtitle="Inscripciones recibidas este mes en eventos creados este mes, hora de Bogotá"
        >
          <RegistrationsTimelineChart data={data.registrationsTimeline} />
        </Panel>

        <Panel
          className="lg:col-span-8"
          title="¿Cómo interactúan con tus eventos?"
          subtitle="Vistas, me gusta y compartidos acumulados de tus 6 eventos publicados con mejor puntuación, creados el mes pasado o este mes. Cada columna tiene su propia escala."
        >
          <InteractivityTable data={data.interactivity} />
        </Panel>
        <Panel
          className="lg:col-span-4"
          title="Qué hacer ahora"
          subtitle="Sugerencias a partir de los datos de esta página"
        >
          {nextSteps.length > 0 ? (
            <ul className="space-y-3 text-sm leading-relaxed text-zinc-700">
              {nextSteps.map((step) => (
                <li key={step} className="border-l-2 pl-3" style={{ borderColor: CHART.primary }}>
                  {step}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">
              Cuando tus eventos tengan al menos 20 vistas te diremos qué mejorar.
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}
