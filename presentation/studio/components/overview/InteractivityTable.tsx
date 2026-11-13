import { ChartEmpty } from "../charts/ChartEmpty";
import { CHART, formatCompact, formatNumber } from "../charts/chartTheme";

interface InteractivityTableProps {
  data: { eventName: string; views: number; likes: number; shares: number }[];
}

const METRICS = [
  { key: "views", label: "Vistas" },
  { key: "likes", label: "Van a ir" },
  { key: "shares", label: "Compartidos" },
] as const;

/**
 * Múltiplos pequeños en tabla: una columna por métrica, cada una con su propia
 * escala. Vistas y me gusta difieren en órdenes de magnitud; en un solo eje
 * (barras agrupadas) los me gusta y compartidos quedarían invisibles.
 */
export function InteractivityTable({ data }: InteractivityTableProps) {
  if (data.length === 0) return <ChartEmpty height={260} />;
  const max = Object.fromEntries(
    METRICS.map((m) => [m.key, Math.max(1, ...data.map((d) => d[m.key]))]),
  ) as Record<(typeof METRICS)[number]["key"], number>;

  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[520px] border-separate border-spacing-x-1 text-sm">
        <caption className="sr-only">Vistas, «voy a ir» y compartidos por evento</caption>
        <thead>
          <tr className="text-left text-xs text-zinc-500">
            <th scope="col" className="pb-2 font-normal">Evento</th>
            {METRICS.map((m) => (
              <th key={m.key} scope="col" className="w-[22%] border-l border-transparent pb-2 pl-3 font-medium text-zinc-700">
                {m.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={`${i}-${row.eventName}`}>
              <th
                scope="row"
                className="max-w-0 truncate border-t border-zinc-100 py-2.5 pr-3 text-left font-normal text-zinc-900"
                title={row.eventName}
              >
                {row.eventName}
              </th>
              {METRICS.map((m) => (
                <td key={m.key} className="border-l border-t border-zinc-100 py-2.5 pl-3 align-top">
                  {/* el número va ARRIBA y a la izquierda, bajo su encabezado: a la derecha de la barra se leía como parte de la columna vecina */}
                  <div className="grid gap-1.5">
                    <span className="text-base font-semibold tabular-nums text-zinc-900" title={formatNumber(row[m.key])}>
                      {formatCompact(row[m.key])}
                    </span>
                    <div className="h-2 rounded-full" style={{ background: CHART.track }}>
                      {row[m.key] > 0 && (
                        <div className="h-full rounded-full" style={{ width: `${(row[m.key] / max[m.key]) * 100}%`, background: CHART.primary }} />
                      )}
                    </div>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
