import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import type { PanelFicha, Period } from "@/presentation/studio/lib/panelModel";
import { cn } from "@/app/lib/utils/cn";
import { fmt } from "./format";

/** Selector de ficha con miniatura (enlaces, no un select): `?f=<tipo:id>` conserva el período. */
export function FichaChips({ fichas, period }: { fichas: PanelFicha[]; period: Period }) {
  return (
    <nav aria-label="Elige un evento o sitio" className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
      {fichas.map((f) => (
        <Link
          key={f.key}
          href={`?f=${encodeURIComponent(f.key)}&d=${period}`}
          scroll={false}
          aria-current={f.selected ? "page" : undefined}
          className={cn(
            "flex min-h-16 shrink-0 items-center gap-3 rounded-2xl bg-white p-2.5 pr-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            f.selected ? "border-2 border-primary" : "border border-slate-200 hover:border-slate-300",
          )}
        >
          {f.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- miniatura de panel
            <img src={f.image} alt="" className="size-11 shrink-0 rounded-[10px] bg-slate-100 object-cover" />
          ) : (
            <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-slate-100 text-slate-400">
              {f.type === "event" ? <CalendarDays className="size-5" /> : <MapPin className="size-5" />}
            </span>
          )}
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="max-w-52 truncate text-sm font-semibold text-slate-900">{f.name}</span>
            <span className="text-xs text-slate-500">{f.type === "event" ? "Evento" : "Sitio"} · {fmt(f.views30)} visitas (30 d)</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
