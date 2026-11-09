import type { SourceShare } from "@/domain/entities/analytics/fichaStats";

// La fuente principal lleva el color de marca; las demás, tonos de gris (un solo énfasis, sin arcoíris).
const SHADES = ["bg-primary", "bg-slate-700", "bg-slate-500", "bg-slate-400", "bg-slate-300"];

/** Barra de origen de las visitas. El color nunca es la única señal: cada tramo está en la leyenda con nombre y %. */
export function SourceBar({ sources }: { sources: SourceShare[] }) {
  if (sources.length === 0) return <p className="text-sm text-slate-500">Todavía no hay visitas registradas en estos 30 días.</p>;
  const summary = sources.map((s) => `${s.label} ${s.pct}%`).join(", ");
  return (
    <div>
      <div role="img" aria-label={`Origen: ${summary}`} className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-gray-100">
        {sources.map((s, i) => (
          <span key={s.key} className={SHADES[i] ?? "bg-slate-300"} style={{ width: `${Math.max(s.pct, 2)}%` }} />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
        {sources.map((s, i) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span aria-hidden className={`size-2 rounded-full ${SHADES[i] ?? "bg-slate-300"}`} />
            {s.label} <span className="font-semibold tabular-nums text-slate-900">{s.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
