import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";
import type { KpiViewModel } from "../../view-models/StudioOverviewViewModel";
import { CountUp } from "@/app/components/motion/primitives";
import { formatNumber } from "../charts/chartTheme";

interface StudioKpiCardsProps {
  kpis: {
    views: KpiViewModel;
    registrations: KpiViewModel;
    likes: KpiViewModel;
    activeEvents: KpiViewModel;
  };
}

const pctFmt = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });

function KpiTile({ kpi }: { kpi: KpiViewModel }) {
  const positive = kpi.changePct >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  // Sin base del mes anterior el % no significa nada: no se muestra.
  const hasPreviousBaseline = typeof kpi.previousValue === "number" && kpi.previousValue > 0;

  return (
    <div className="bg-white px-4 py-4 sm:px-5">
      <p className="text-sm text-zinc-500">{kpi.label}</p>
      <p className="mt-2 font-heading text-3xl font-semibold tabular-nums tracking-tight text-zinc-950">
        <CountUp value={kpi.value} format={formatNumber} />
      </p>
      {hasPreviousBaseline && (
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium tabular-nums",
              positive ? "text-emerald-700" : "text-red-700",
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only">{positive ? "Sube" : "Baja"}</span>
            {positive ? "+" : "−"}
            {pctFmt.format(Math.abs(kpi.changePct))} %
          </span>
          <span>vs. {formatNumber(kpi.previousValue!)} el mes anterior</span>
        </p>
      )}
    </div>
  );
}

export function StudioKpiCards({ kpis }: StudioKpiCardsProps) {
  // Una sola franja dividida (no 4 tarjetas sueltas): se lee como una fila de métricas.
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 sm:grid-cols-2 xl:grid-cols-4">
      <KpiTile kpi={kpis.views} />
      <KpiTile kpi={kpis.registrations} />
      <KpiTile kpi={kpis.likes} />
      <KpiTile kpi={kpis.activeEvents} />
    </div>
  );
}
