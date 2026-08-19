"use client"

import { useRef, useState } from "react"
import { AnimatePresence } from "motion/react"
import { MapPinned, Plus } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { SiteCard } from "./SiteCard"
import { FILTER_TABS } from "../../lib/constants"
import type { SiteFilterTab, SiteListItem } from "../../view-models/SiteFormViewModel"
import { cn } from "@/app/lib/utils/cn"

interface ListPanelProps {
  items: SiteListItem[]
  totalFiltered: number
  counts: Record<SiteFilterTab, number>
  tab: SiteFilterTab
  onTabChange: (tab: SiteFilterTab) => void
  hoveredId: string | null
  onHover: (id: string | null) => void
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onCreate: () => void
  isLoading: boolean
}

const EMPTY: Record<SiteFilterTab, string> = {
  all:      "Aún no has agregado sitios.",
  approved: "No tienes sitios aprobados.",
  pending:  "No tienes sitios en revisión.",
  rejected: "No tienes sitios rechazados.",
  draft:    "No tienes borradores guardados.",
}

export function ListPanel({
  items, totalFiltered, counts, tab, onTabChange,
  hoveredId, onHover, onOpen, onEdit, onCreate, isLoading,
}: ListPanelProps) {
  const noSites = !isLoading && counts.all === 0
  const tabsRef = useRef<HTMLDivElement>(null)
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(true)

  const handleTabsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    setShowLeftFade(el.scrollLeft > 4)
    setShowRightFade(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      {/* Filter tabs — fades hint scroll on both sides */}
      <div className="relative shrink-0 border-b border-border">
        <div
          ref={tabsRef}
          onScroll={handleTabsScroll}
          className="flex gap-1 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
        {FILTER_TABS.map(({ key, label }) => {
          const active = tab === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onTabChange(key)}
              className={cn(
                "relative shrink-0 border-b-2 px-2.5 py-2.5 text-xs font-medium transition-colors",
                active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
              <span className={cn(
                "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                active ? "bg-[#FDF2F4] text-[#E63946]" : "bg-muted text-muted-foreground",
              )}>
                {counts[key] ?? 0}
              </span>
            </button>
          )
        })}
        </div>
        {/* Left fade — shows when scrolled right */}
        {showLeftFade && (
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-linear-to-r from-background to-transparent" aria-hidden />
        )}
        {/* Right fade — shows when more tabs hidden to the right */}
        {showRightFade && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-background to-transparent" aria-hidden />
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-3 rounded-xl border border-border bg-card p-3">
                <div className="size-20 shrink-0 animate-pulse rounded-lg bg-muted" />
                <div className="flex flex-1 flex-col gap-2 py-1">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="mt-auto h-8 w-24 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : noSites ? (
          <EmptyState onCreate={onCreate} />
        ) : totalFiltered === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <MapPinned className="size-9 text-muted-foreground/30" aria-hidden />
            <div>
              <p className="text-sm font-medium text-foreground">{EMPTY[tab]}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Prueba seleccionando otro filtro.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {items.map((site) => (
                <SiteCard key={site.id} site={site} active={hoveredId === site.id} onEdit={onEdit} onOpen={onOpen} onHover={onHover} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-[#FDF2F4]">
        <MapPinned className="size-8 text-[#E63946]" aria-hidden />
      </span>
      <div className="max-w-xs">
        <h2 className="text-base font-semibold text-foreground">Aún no has agregado sitios</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Crea tu primer punto de interés y aparecerá aquí y en el mapa.
        </p>
      </div>
      <Button className="gap-1.5" onClick={onCreate}>
        <Plus className="size-4" aria-hidden />
        Crear mi primer sitio
      </Button>
    </div>
  )
}
