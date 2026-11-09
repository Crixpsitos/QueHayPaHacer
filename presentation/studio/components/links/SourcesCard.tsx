import type { SourceShare } from "@/domain/entities/analytics/fichaStats";

const SHADES = ["bg-primary", "bg-slate-600", "bg-slate-500", "bg-slate-400", "bg-slate-300", "bg-slate-300"];

export function SourcesCard({ sources }: { sources: SourceShare[] }) {
  return (
    <section className="rounded-[20px] border border-slate-200 bg-white p-5 sm:p-7">
      <h3 className="text-xl font-semibold text-slate-900">De dónde llegan</h3>
      {sources.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Aún no hay visitas con origen en este período.</p>
      ) : (
        <ul className="mt-[18px] flex flex-col gap-3.5">
          {sources.map((s, i) => (
            <li key={s.key} className="grid grid-cols-[92px_minmax(0,1fr)_40px] items-center gap-2.5 text-sm">
              <span className="truncate text-slate-900">{s.label}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-slate-100"><span className={`block h-full rounded-full ${SHADES[i] ?? "bg-slate-300"}`} style={{ width: `${Math.max(s.pct, 2)}%` }} /></span>
              <span className="text-right font-semibold tabular-nums text-slate-900">{s.pct}%</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs leading-snug text-slate-500">Solo visitas, no clics. Cifras mínimas: una persona cuenta una vez al día.</p>
    </section>
  );
}
