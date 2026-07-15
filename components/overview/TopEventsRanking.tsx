import { Eye } from "lucide-react";

interface TopEventsRankingProps {
  events: { eventId: string; name: string; score: number; views: number }[];
}

const formatNumber = (n: number) => n.toLocaleString("es-CO");

// El score va de 0 a 150 (escala absoluta).
const SCORE_MAX = 150;

export function TopEventsRanking({ events }: TopEventsRankingProps) {
  return (
    <ul className="space-y-3">
      {events.map((event, index) => (
        <li key={event.eventId} className="flex items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-xs font-bold tabular-nums text-indigo-700">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-slate-800">{event.name}</p>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-500">
                {Number(event.score.toFixed(2))}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{ width: `${Math.min(100, (event.score / SCORE_MAX) * 100)}%` }}
              />
            </div>
            <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-400">
              <Eye className="h-3 w-3" />
              {formatNumber(event.views)} vistas
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
