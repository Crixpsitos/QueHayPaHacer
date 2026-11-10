"use client";

import { PERIODS } from "@/presentation/studio/lib/panelNav";
import { cn } from "@/app/lib/utils/cn";
import { usePanelNav } from "./PanelNav";

export function PeriodTabs() {
  const { nav, go } = usePanelNav();
  return (
    <div role="group" aria-label="Período" className="flex gap-1 rounded-[10px] bg-slate-200 p-1">
      {PERIODS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => go({ d: p })}
          aria-pressed={p === nav.d}
          className={cn("min-h-11 rounded-[7px] px-4 text-sm focus-visible:outline-2 focus-visible:outline-primary", p === nav.d ? "bg-white font-semibold text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}
        >
          {p} días
        </button>
      ))}
    </div>
  );
}
