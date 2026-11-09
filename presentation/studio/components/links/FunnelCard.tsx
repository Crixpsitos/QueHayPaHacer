import type { PanelDetail } from "@/presentation/studio/lib/panelModel";
import { fmt } from "./format";

/** Del vistazo a la acción, con barras a escala real (si pocas personas llegan al final, se ve pequeño: eso es lo honesto). */
export function FunnelCard({ kpis }: { kpis: PanelDetail["kpis"] }) {
  const steps = [
    { label: "Vieron la ficha", sub: "", n: kpis.views, w: 100, color: "bg-slate-900" },
    { label: "Se interesaron", sub: "compartieron o miraron cómo llegar", n: kpis.interest, w: kpis.views ? (kpis.interest / kpis.views) * 100 : 0, color: "bg-slate-600" },
    { label: "Hicieron clic en una acción", sub: "comprar, reservar, escribir", n: kpis.action, w: kpis.views ? (kpis.action / kpis.views) * 100 : 0, color: "bg-primary" },
  ];
  return (
    <section className="rounded-[20px] border border-slate-200 bg-white p-5 sm:p-7">
      <h3 className="text-xl font-semibold text-slate-900">Del vistazo a la acción</h3>
      <p className="mt-1.5 mb-5 text-sm text-slate-600">Cuántas personas llegan a cada paso. Las barras están a escala real.</p>
      <ol className="flex flex-col gap-[18px]">
        {steps.map((s) => (
          <li key={s.label}>
            <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
              <span className="font-semibold text-slate-900">{s.label} {s.sub && <span className="font-normal text-slate-500">· {s.sub}</span>}</span>
              <span className="text-lg font-semibold tabular-nums text-slate-900">{fmt(s.n)}</span>
            </div>
            <div className="h-3.5 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${s.color}`} style={{ width: `${Math.min(s.n > 0 ? Math.max(s.w, 1) : 0, 100)}%` }} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
