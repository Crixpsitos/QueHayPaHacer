import type { PanelDetail } from "@/presentation/studio/lib/panelModel";
import { fmt, shortDay } from "./format";

export function VisitsChart({ series, periodDays }: { series: PanelDetail["series"]; periodDays: number }) {
  const { points, peak } = series;
  const max = Math.max(...points.map((p) => p.views), 1);
  const total = points.reduce((n, p) => n + p.views, 0);
  const mid = points[Math.floor(points.length / 2)];
  return (
    <section className="rounded-[20px] border border-slate-200 bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-xl font-semibold text-slate-900">Visitas por día</h3>
        <span className="text-sm text-slate-500">Últimos {periodDays} días</span>
      </div>
      <div
        role="img"
        aria-label={`Visitas por día, ${fmt(total)} en total${peak ? `; el pico fue el ${shortDay(peak.day)} con ${fmt(peak.views)}` : ""}`}
        className="mt-5 flex h-44 items-end gap-px sm:gap-1"
      >
        {points.map((p) => (
          <div
            key={p.day}
            title={`${shortDay(p.day)}: ${fmt(p.views)}`}
            className={`min-w-0 flex-1 rounded-t ${peak && p.day === peak.day ? "bg-primary" : "bg-slate-300"}`}
            style={{ height: `${Math.max((p.views / max) * 100, p.views > 0 ? 3 : 1)}%` }}
          />
        ))}
      </div>
      <div className="mt-2.5 flex justify-between text-xs text-slate-500" aria-hidden>
        <span>{shortDay(points[0].day)}</span><span>{shortDay(mid.day)}</span><span>{shortDay(points[points.length - 1].day)}</span>
      </div>
      {peak ? (
        <p className="mt-4 rounded-[10px] bg-red-50 px-3.5 py-3 text-sm leading-snug text-red-900">
          <strong>Pico el {shortDay(peak.day)} ({fmt(peak.views)} {peak.views === 1 ? "visita" : "visitas"}).</strong> Mira qué publicaste ese día: ahí está lo que funciona.
        </p>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Todavía no hay visitas en este período.</p>
      )}
    </section>
  );
}
