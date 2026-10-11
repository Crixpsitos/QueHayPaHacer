import { GrowBar } from "./GrowBar";
import { ChartEmpty } from "../charts/ChartEmpty";
import { CHART, formatCompact, formatNumber, formatPercent } from "../charts/chartTheme";
import type { ConversionRowViewModel } from "../../view-models/StudioOverviewViewModel";

interface ConversionRankingProps {
  rows: ConversionRowViewModel[];
}

/**
 * Lista ordenada por conversión (inscritos ÷ vistas). Barras horizontales en
 * HTML: una sola medida, etiquetas largas y valor siempre visible → no hace
 * falta Recharts ni tooltip.
 */
export function ConversionRanking({ rows }: ConversionRankingProps) {
  if (rows.length === 0) return <ChartEmpty height={260} />;
  // Escala relativa a la mejor tasa: las tasas reales suelen ser < 10 % y en
  // escala 0–100 % todas las barras serían casi invisibles. El % va escrito.
  const maxRate = Math.max(...rows.map((r) => r.rate ?? 0));
  const bestId = maxRate > 0 ? rows[0].eventId : null;

  return (
    <ul className="divide-y divide-zinc-100">
      {rows.map((row, i) => (
        <li key={row.eventId} className="py-2.5 first:pt-0 last:pb-0">
          <div className="flex items-baseline justify-between gap-3">
            <p className="flex min-w-0 items-center gap-2 text-sm text-zinc-900">
              <span className="truncate" title={row.eventName}>
                {row.eventName}
              </span>
              {row.eventId === bestId && (
                <span
                  className="shrink-0 rounded px-1.5 py-px text-[11px] font-medium text-zinc-950"
                  style={{ background: CHART.gold }}
                >
                  Mejor conversión
                </span>
              )}
            </p>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-950">
              {row.rate === null ? "—" : formatPercent(row.rate)}
            </span>
          </div>
          <div
            className="mt-1.5 h-2 w-full rounded-full"
            style={{ background: CHART.track }}
            role="img"
            aria-label={
              row.rate === null
                ? `${row.eventName}: sin vistas todavía`
                : `${row.eventName}: ${formatPercent(row.rate)} de conversión, ${formatNumber(row.registrations)} inscritos de ${formatNumber(row.views)} vistas`
            }
          >
            {row.rate !== null && maxRate > 0 && (
              <GrowBar
                className="h-full rounded-full"
                pct={Math.max(1, (row.rate / maxRate) * 100)}
                color={CHART.primary}
                delay={i * 0.06}
              />
            )}
          </div>
          <p className="mt-1 text-xs tabular-nums text-zinc-500">
            {row.rate === null
              ? "Sin vistas todavía"
              : `${formatNumber(row.registrations)} inscritos de ${formatCompact(row.views)} vistas`}
          </p>
        </li>
      ))}
    </ul>
  );
}
