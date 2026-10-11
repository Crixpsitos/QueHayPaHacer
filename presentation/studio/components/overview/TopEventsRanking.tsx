import { ChartEmpty } from "../charts/ChartEmpty";
import { CHART, formatCompact } from "../charts/chartTheme";

interface TopEventsRankingProps {
  events: { eventId: string; name: string; score: number; views: number }[];
}

// El score va de 0 a 150 (escala absoluta), así la barra es comparable entre meses.
const SCORE_MAX = 150;
const scoreFmt = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });

export function TopEventsRanking({ events }: TopEventsRankingProps) {
  if (events.length === 0) return <ChartEmpty height={200} />;
  return (
    <ol className="space-y-4">
      {events.map((event, index) => (
        <li key={event.eventId} className="grid grid-cols-[1.25rem_1fr] gap-x-2">
          <span className="pt-px text-sm tabular-nums text-zinc-400">{index + 1}</span>
          <div className="min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate text-sm font-medium text-zinc-900" title={event.name}>
                {event.name}
              </p>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-900">
                {scoreFmt.format(event.score)}
              </span>
            </div>
            <div
              className="mt-1.5 h-1.5 w-full rounded-full"
              style={{ background: CHART.track }}
              role="img"
              aria-label={`Puntuación ${scoreFmt.format(event.score)} de ${SCORE_MAX}`}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, (event.score / SCORE_MAX) * 100)}%`,
                  background: CHART.ink,
                }}
              />
            </div>
            <p className="mt-1 text-xs tabular-nums text-zinc-500">{formatCompact(event.views)} vistas</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
