"use client";

import { CalendarDays, Compass, MapPin } from "lucide-react";
import type { PanelFicha } from "@/presentation/studio/lib/panelModel";
import { cn } from "@/app/lib/utils/cn";
import { fmt } from "./format";
import { usePanelNav } from "./PanelNav";

/** Selector de ficha con miniatura. Resalta al instante la que tocas y respeta el filtro por tipo. */
export function FichaChips({ fichas }: { fichas: PanelFicha[] }) {
  const { nav, go } = usePanelNav();
  const visible = fichas.filter((f) => nav.t === "all" || f.type === nav.t);
  return (
    <div role="group" aria-label="Elige un evento o sitio" className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
      {visible.map((f) => {
        const selected = f.key === nav.f;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => go({ f: f.key })}
            aria-pressed={selected}
            className={cn(
              "flex min-h-16 shrink-0 items-center gap-3 rounded-2xl bg-white p-2.5 pr-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              selected ? "border-2 border-primary" : "border border-slate-200 hover:border-slate-300",
            )}
          >
            {f.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- miniatura de panel
              <img src={f.image} alt="" className="size-11 shrink-0 rounded-[10px] bg-slate-100 object-cover" />
            ) : (
              <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-slate-100 text-slate-400">
                {f.type === "event" ? <CalendarDays className="size-5" /> : f.type === "activity" ? <Compass className="size-5" /> : <MapPin className="size-5" />}
              </span>
            )}
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="max-w-52 truncate text-sm font-semibold text-slate-900">{f.name}</span>
              <span className="text-xs text-slate-500">{f.type === "event" ? "Evento" : f.type === "activity" ? "Actividad" : "Sitio"} · {fmt(f.views30)} visitas (30 d)</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
