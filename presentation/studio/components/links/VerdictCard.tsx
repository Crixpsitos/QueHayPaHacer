import type { PanelDetail } from "@/presentation/studio/lib/panelModel";
import { cn } from "@/app/lib/utils/cn";
import { fmt } from "./format";

const CHIP: Record<PanelDetail["verdict"]["level"], string> = {
  good: "bg-emerald-50 text-emerald-700",
  ok: "bg-sky-50 text-sky-700",
  low: "bg-amber-50 text-amber-800",
  few: "bg-slate-100 text-slate-700",
};

function Kpi({ value, label, note }: { value: number; label: string; note?: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 sm:p-[18px]">
      <dd className="text-3xl font-semibold leading-none tracking-tight tabular-nums text-slate-900 sm:text-4xl">{fmt(value)}</dd>
      <dt className="mt-2 text-sm text-slate-600">{label}</dt>
      {note && <p className="mt-1.5 text-xs text-slate-500">{note}</p>}
    </div>
  );
}

/** Lo primero que lee el dueño: una frase que dice si la ficha funciona (o que aún no se puede saber), y tres cifras. */
export function VerdictCard({ detail }: { detail: PanelDetail }) {
  const { verdict: v, kpis: k } = detail;
  const delta = k.viewsDeltaPct;
  return (
    <section aria-label="Resumen" className="grid gap-6 rounded-[20px] border border-slate-200 bg-white p-5 sm:p-8 lg:grid-cols-2 lg:items-center lg:gap-8">
      <div>
        <span className={cn("inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-semibold", CHIP[v.level])}>
          <span aria-hidden className="size-2 rounded-full bg-current" /> {v.label}
        </span>
        <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-[32px]">{v.headline}</h2>
        <p className="mt-3 text-base leading-relaxed text-slate-600">{v.detail}</p>
      </div>
      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
        <Kpi value={k.views} label="visitas" note={delta === null ? undefined : `${delta > 0 ? "+" : ""}${delta}% vs. el período anterior`} />
        <Kpi value={k.interest} label="se interesaron" note={`${k.interestPct}% de las visitas`} />
        <Kpi value={k.action} label="hicieron clic en una acción" note={`${k.actionPct}% de las visitas`} />
      </dl>
    </section>
  );
}
