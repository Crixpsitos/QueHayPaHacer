import { CalendarRange, Heart, MousePointerClick, Share2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";

/**
 * Lenguaje visual único de las métricas de un sitio (icono + color + label).
 * Fuente de verdad compartida entre la lista (`MetricPill`) y el detalle
 * (`MetricCard`) para que el usuario aprenda el código de color una sola vez.
 */
export type SiteMetricKey = "clicks" | "likes" | "shares" | "events";

interface MetricMeta {
  label: string;
  hint: string;
  Icon: LucideIcon;
  /** Color del icono/valor. */
  fg: string;
  /** Fondo del chip del icono (solo en `MetricCard`). */
  bg: string;
}

const META: Record<SiteMetricKey, MetricMeta> = {
  clicks: {
    label: "Clicks",
    hint: "Veces que abrieron el sitio",
    Icon: MousePointerClick,
    fg: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  likes: {
    label: "Me gusta",
    hint: "A cuántas personas les gustó",
    Icon: Heart,
    fg: "text-rose-600",
    bg: "bg-rose-50",
  },
  shares: {
    label: "Compartidos",
    hint: "Veces que compartieron el sitio",
    Icon: Share2,
    fg: "text-sky-600",
    bg: "bg-sky-50",
  },
  events: {
    label: "Eventos",
    hint: "Eventos realizados aquí",
    Icon: CalendarRange,
    fg: "text-slate-600",
    bg: "bg-slate-100",
  },
};

export const formatMetric = (n: number) => n.toLocaleString("es-CO");

/** Métrica compacta en línea (icono + número). Para las cards de la lista. */
export function MetricPill({ metric, value }: { metric: SiteMetricKey; value: number }) {
  const { Icon, fg, label } = META[metric];
  return (
    <span className="inline-flex items-center gap-1.5" title={label}>
      <Icon className={cn("h-4 w-4", fg)} />
      <span className="font-semibold tabular-nums text-slate-800">{formatMetric(value)}</span>
    </span>
  );
}

/** Tarjeta KPI (icono + label + número grande + ayuda). Para el detalle. */
export function MetricCard({ metric, value }: { metric: SiteMetricKey; value: number }) {
  const { Icon, fg, bg, label, hint } = META[metric];
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", bg)}>
          <Icon className={cn("h-4 w-4", fg)} />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-slate-900">
        {formatMetric(value)}
      </p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}
