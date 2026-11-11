"use client"

import { useState, type ReactNode } from "react"
import { cn } from "@/app/lib/utils/cn"

export interface MoreTab { key: string; label: string; count: number; content: ReactNode }

/**
 * Celular: pestañas, una tarjeta a la vez. Escritorio: las tarjetas lado a lado (todas del mismo alto, ver MoreToDo).
 * El contenido llega ya dibujado por el servidor; aquí solo se elige cuál se ve en el celular.
 */
export function MoreToDoTabs({ tabs }: { tabs: MoreTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key)
  return (
    <div className="grid gap-3">
      <div role="tablist" aria-label="Más para hacer" className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:hidden">
        {tabs.map((t) => (
          <button key={t.key} role="tab" id={`more-tab-${t.key}`} aria-selected={active === t.key} aria-controls={`more-${t.key}`} type="button" onClick={() => setActive(t.key)}
            className={cn("min-h-11 shrink-0 rounded-full border-[1.5px] px-4 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/40", active === t.key ? "border-primary-dark bg-primary-dark text-white" : "border-border bg-card")}>
            {t.label} · {t.count}
          </button>
        ))}
      </div>
      <div className="grid gap-3.5 sm:grid-cols-3">
        {tabs.map((t) => (
          <div key={t.key} id={`more-${t.key}`} role="tabpanel" aria-labelledby={`more-tab-${t.key}`} className={cn(active === t.key ? "block" : "hidden", "sm:block")}>{t.content}</div>
        ))}
      </div>
    </div>
  )
}
