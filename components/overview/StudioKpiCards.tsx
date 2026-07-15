import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";
import type { KpiViewModel } from "../../view-models/StudioOverviewViewModel";

interface StudioKpiCardsProps {
  kpis: {
    views: KpiViewModel;
    registrations: KpiViewModel;
    likes: KpiViewModel;
    activeEvents: KpiViewModel;
  };
}

const formatNumber = (n: number) => n.toLocaleString("es-CO");

function KpiCard({ kpi }: { kpi: KpiViewModel }) {
  const positive = kpi.changePct >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  const hasPreviousBaseline =
    typeof kpi.previousValue === "number" && kpi.previousValue > 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {kpi.label}
      </p>
      <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-slate-900">
        {formatNumber(kpi.value)}
      </p>
      {hasPreviousBaseline && (
        <p className="mt-1 text-xs text-slate-500">
          Mes anterior: <span className="font-medium tabular-nums">{formatNumber(kpi.previousValue!)}</span>
        </p>
      )}
      {hasPreviousBaseline && (
        <p
          className={cn(
            "mt-1.5 inline-flex items-center gap-1 text-xs font-medium",
            positive ? "text-emerald-600" : "text-red-500",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {positive ? "+" : ""}
          {kpi.changePct.toFixed(1)}% vs mes anterior
        </p>
      )}
    </div>
  );
}

export function StudioKpiCards({ kpis }: StudioKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard kpi={kpis.views} />
      <KpiCard kpi={kpis.registrations} />
      <KpiCard kpi={kpis.likes} />
      <KpiCard kpi={kpis.activeEvents} />
    </div>
  );
}
