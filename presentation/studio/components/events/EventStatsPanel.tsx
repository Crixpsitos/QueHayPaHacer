"use client";

import dynamic from "next/dynamic";
import { Eye, Users, Heart, Share2, TrendingUp, Info, MousePointerClick } from "lucide-react";
import type { EventStatsViewModel } from "../../view-models/StudioEventsViewModel";
import { EventTeamCard } from "./EventTeamCard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

const RegistrationRampChart = dynamic(() => import("../charts/RegistrationRampChart"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] w-full animate-pulse items-center justify-center rounded-lg bg-gray-100 text-sm text-slate-400">
      Cargando gráfica…
    </div>
  ),
});

const formatNumber = (n: number) => n.toLocaleString("es-CO");

const SCORE_ITEM = {
  key: "score",
  label: "Score",
  icon: TrendingUp,
  hint: "Puntuación de rendimiento del evento. Mientras más alta, mejor le está yendo y más se recomienda frente a otros eventos.",
} as const;

const VIEWS_ITEM = { key: "views", label: "Vistas", icon: Eye } as const;
const REGISTRATIONS_ITEM = { key: "registrations", label: "Registros", icon: Users } as const;
const LIKES_ITEM = { key: "likes", label: "Likes", icon: Heart } as const;
const SHARES_ITEM = { key: "shares", label: "Compartidos", icon: Share2 } as const;
// En eventos externos no hay inscritos en la plataforma; el registro ocurre fuera.
// Por eso, en lugar de "Registros" (siempre 0), mostramos los clics al botón externo.
const CLICKS_ITEM = {
  key: "clicks",
  label: "Clicks",
  icon: MousePointerClick,
  hint: "Personas que pulsaron \"Registrarse\" para ir al sitio externo. El registro ocurre fuera de la plataforma.",
} as const;

interface EventStatsPanelProps {
  stats: EventStatsViewModel;
}

export function EventStatsPanel({ stats }: EventStatsPanelProps) {
  // Para externos, la segunda métrica es "Clicks" (no "Registros", que sería 0).
  const isExternal = stats.registrationType === "external";
  const statItems = [
    VIEWS_ITEM,
    isExternal ? CLICKS_ITEM : REGISTRATIONS_ITEM,
    LIKES_ITEM,
    SHARES_ITEM,
    SCORE_ITEM,
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-900">Estadísticas del evento</h2>

      <TooltipProvider>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {statItems.map((item) => (
            <div key={item.key} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
                {"hint" in item && item.hint && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Qué es ${item.label}`}
                        className="text-slate-300 transition-colors hover:text-slate-500"
                      >
                        <Info className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{item.hint}</TooltipContent>
                  </Tooltip>
                )}
              </p>
              <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                {formatNumber(stats[item.key])}
              </p>
            </div>
          ))}
        </div>
      </TooltipProvider>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <header className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Ritmo de inscripción</h3>
          <p className="mt-0.5 text-xs text-slate-400">Inscripciones acumuladas a medida que se acerca el evento</p>
        </header>
        <RegistrationRampChart data={stats.registrationRamp} unit={stats.rampUnit} />
      </div>

      {stats.team.length > 0 && <EventTeamCard team={stats.team} />}
    </div>
  );
}
