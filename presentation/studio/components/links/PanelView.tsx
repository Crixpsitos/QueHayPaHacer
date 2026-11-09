import type { PanelVM } from "@/presentation/studio/lib/panelModel";
import { FichaChips } from "./FichaChips";
import { PeriodTabs } from "./PeriodTabs";
import { VerdictCard } from "./VerdictCard";
import { VisitsChart } from "./VisitsChart";
import { FunnelCard } from "./FunnelCard";
import { SourcesCard } from "./SourcesCard";
import { NextStepCard } from "./NextStepCard";
import { ChannelLinksCard } from "./ChannelLinksCard";

/** Panel "Visitas y enlaces": ¿esta ficha está funcionando?, de dónde llegan y qué enlace usar. */
export function PanelView({ panel, baseUrl }: { panel: PanelVM; baseUrl: string }) {
  const { detail } = panel;
  const selectedKey = panel.fichas.find((f) => f.selected)?.key ?? null;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[32px]">Visitas y enlaces</h1>
          <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-slate-600">¿Tu evento está funcionando? Aquí lo ves claro, con cifras honestas y qué hacer después.</p>
        </div>
        {detail && <PeriodTabs period={panel.period} selectedKey={selectedKey} />}
      </div>

      {!detail ? (
        <div role="status" className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <p className="text-sm font-medium text-slate-900">Aún no tienes nada publicado</p>
          <p className="mt-1 text-sm text-slate-500">Cuando publiques un evento o un sitio, aquí verás sus visitas y tendrás tus enlaces listos para compartir.</p>
        </div>
      ) : (
        <>
          <FichaChips fichas={panel.fichas} period={panel.period} />
          <VerdictCard detail={detail} />
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-6">
              <VisitsChart series={detail.series} periodDays={panel.period} />
              <FunnelCard kpis={detail.kpis} />
            </div>
            <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-6">
              <SourcesCard sources={detail.sources} />
              <NextStepCard detail={detail} baseUrl={baseUrl} />
            </div>
          </div>
          <ChannelLinksCard detail={detail} baseUrl={baseUrl} />
        </>
      )}
      <p className="text-xs text-slate-400">Cifras mínimas: una misma persona cuenta una vez al día. Muestra tus 25 eventos y 25 sitios publicados más recientes.</p>
    </div>
  );
}
