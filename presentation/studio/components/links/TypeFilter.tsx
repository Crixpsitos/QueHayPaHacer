"use client";

import type { PanelVM } from "@/presentation/studio/lib/panelModel";
import type { TypeFilter as T } from "@/presentation/studio/lib/panelNav";
import { cn } from "@/app/lib/utils/cn";
import { usePanelNav } from "./PanelNav";

const TABS: { id: T; label: string }[] = [{ id: "all", label: "Todos" }, { id: "event", label: "Eventos" }, { id: "site", label: "Sitios" }];

/** Todos / Eventos / Sitios con su cantidad. Solo se muestra si hay de los dos tipos (si no, no hay nada que filtrar). */
export function TypeFilter({ counts }: { counts: PanelVM["counts"] }) {
  const { nav, go } = usePanelNav();
  if (!counts.event || !counts.site) return null;
  return (
    <div role="group" aria-label="Mostrar" className="flex w-fit gap-1 rounded-[10px] bg-slate-200 p-1">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => go({ t: t.id })}
          aria-pressed={nav.t === t.id}
          className={cn("min-h-11 rounded-[7px] px-4 text-sm focus-visible:outline-2 focus-visible:outline-primary", nav.t === t.id ? "bg-white font-semibold text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}
        >
          {t.label} <span className="tabular-nums text-slate-500">({counts[t.id]})</span>
        </button>
      ))}
    </div>
  );
}
