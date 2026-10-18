/**
 * Tema único de las gráficas del Estudio. Carmesí = serie principal, tinta =
 * secundaria, dorado = un solo resaltado, neutros para el resto.
 * (Validado: separación CVD y contraste ≥3:1 pasan; tinta/neutro fallan
 * banda/croma a propósito porque la marca los define acromáticos.)
 */
export const CHART = {
  primary: "#E63946",
  ink: "#09090B",
  gold: "#FFB703",
  neutral: "#71717A",
  grid: "#F4F4F5",
  tick: "#71717A",
  track: "#F4F4F5",
} as const;

export const AXIS_TICK = { fontSize: 12, fill: CHART.tick } as const;

const compact = new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 });
const plain = new Intl.NumberFormat("es-CO");
const pct = new Intl.NumberFormat("es-CO", { style: "percent", maximumFractionDigits: 1 });

/** 1234 → "1,2 mil"; por debajo de mil, número exacto. */
export const formatCompact = (n: number) => (Math.abs(n) < 1000 ? plain.format(n) : compact.format(n));
export const formatNumber = (n: number) => plain.format(n);
/** 0.123 → "12,3 %". */
export const formatPercent = (ratio: number) => pct.format(ratio);

// "YYYY-MM-DD" es una fecha de calendario ya resuelta en Bogotá: se interpreta
// a medianoche UTC y se formatea en UTC para no correrla un día.
const dayFmt = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "UTC" });
export const formatDay = (isoDate: string) => dayFmt.format(new Date(`${isoDate}T00:00:00Z`));

interface TooltipCardProps {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{ name?: string | number; value?: unknown; color?: string }>;
  labelFormatter?: (label: string) => string;
}

/** Tooltip como tarjeta blanca pequeña con sombra; se pasa a `<Tooltip content={…} />`. */
export function TooltipCard({ active, label, payload, labelFormatter }: TooltipCardProps) {
  if (!active || !payload?.length) return null;
  const title = labelFormatter ? labelFormatter(String(label)) : String(label ?? "");
  return (
    <div className="rounded-lg bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-zinc-950/5">
      <p className="mb-1 font-medium text-zinc-900">{title}</p>
      {payload.map((p) => (
        <p key={String(p.name)} className="flex items-center gap-2 text-zinc-600">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} aria-hidden />
          {p.name}
          <span className="ml-auto pl-3 font-medium tabular-nums text-zinc-900">
            {formatNumber(Number(p.value ?? 0))}
          </span>
        </p>
      ))}
    </div>
  );
}
