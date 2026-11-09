import type { PanelDetail } from "@/presentation/studio/lib/panelModel";
import { autoLinkHref } from "@/domain/entities/links/autoLinks";
import { AUTO_CHANNELS } from "@/domain/entities/links/autoLinks";
import { CopyButton } from "./CopyButton";

/** Un solo consejo concreto sacado de los datos (o ninguno: mejor callar que inventar). */
export function NextStepCard({ detail, baseUrl }: { detail: PanelDetail; baseUrl: string }) {
  const { next } = detail;
  if (!next) return null;
  const ch = AUTO_CHANNELS.find((c) => c.id === next.channel);
  return (
    <section className="rounded-[20px] bg-slate-900 p-6 text-white sm:p-7">
      <p className="text-xs font-semibold tracking-wide text-slate-300">SIGUIENTE PASO</p>
      <h3 className="mt-2.5 text-xl font-semibold leading-snug sm:text-[22px]">{next.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">{next.body}</p>
      {ch && (
        <CopyButton
          text={`${baseUrl}${autoLinkHref(detail.type, detail.id, ch.id)}`}
          label={`Copiar enlace de ${ch.label.split(" (")[1]?.replace(")", "") ?? ch.label}`}
          className="mt-5 border-0 bg-white"
        />
      )}
    </section>
  );
}
