"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { AlertTriangle, CalendarDays, Eye, EyeOff, Heart, Loader2, MousePointerClick, Pencil, Share2, Trash2 } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/app/components/ui/dialog"
import { CATEGORY_OPTIONS, STATUS_COLORS, STATUS_LABELS, getDisplayStatus } from "../../lib/constants"
import { useSitesStore } from "../../store/useSitesStore"
import type { SiteListItem } from "../../view-models/SiteFormViewModel"
import { cn } from "@/app/lib/utils/cn"

interface SiteCardProps {
  site: SiteListItem
  active: boolean
  onEdit: (id: string) => void
  onOpen: (id: string) => void
  onHover: (id: string | null) => void
}

const fmt = (n: number) => new Intl.NumberFormat("es-CO").format(n)

const CATEGORY_LABELS = Object.fromEntries(CATEGORY_OPTIONS.map((c) => [c.value, c.label]))

const stop = (e: React.MouseEvent) => e.stopPropagation()

export function SiteCard({ site, active, onEdit, onOpen, onHover }: SiteCardProps) {
  const status = getDisplayStatus(site.publicationStatus, site.moderationStatus)
  const color  = STATUS_COLORS[status]
  const label  = STATUS_LABELS[status]

  const deleteSite = useSitesStore((s) => s.deleteSite)
  const setActive  = useSitesStore((s) => s.setActive)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, setPending] = useState(false)

  const isApproved = status === "approved"

  const ctaLabel =
    status === "rejected" ? "Editar y reenviar" :
    status === "draft"    ? "Continuar editando" :
                            "Editar"

  const handleToggleActive = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (pending) return
    setPending(true)
    await setActive(site.id, !site.isActive)
    setPending(false)
  }

  const handleDelete = async () => {
    setPending(true)
    await deleteSite(site.id)
    // card unmounts on success; only reached on rollback
    setPending(false)
    setConfirmOpen(false)
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => onHover(site.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onOpen(site.id)}
      className={cn(
        "group cursor-pointer rounded-xl border bg-card p-3 text-left shadow-xs transition-all",
        active ? "border-primary/60 ring-2 ring-primary/15" : "border-border hover:border-primary/30",
      )}
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
          {site.coverUrl ? (
            <img src={site.coverUrl} alt={`Portada de ${site.name}`} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">Sin foto</div>
          )}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">{site.name}</h3>
            <span className={cn("flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", color.badge)}>
              <span className={cn("size-1.5 rounded-full", color.dotBg)} aria-hidden />
              {label}
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {CATEGORY_LABELS[site.category]} · {site.address}
          </p>
          <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><MousePointerClick className="size-3.5" aria-hidden />{fmt(site.analytics.clicks)}</span>
            <span className="flex items-center gap-1"><Heart className="size-3.5" aria-hidden />{fmt(site.analytics.likes)}</span>
            <span className="flex items-center gap-1"><Share2 className="size-3.5" aria-hidden />{fmt(site.analytics.shares)}</span>
            <span className="flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden />{fmt(site.analytics.eventCount)}</span>
          </div>
        </div>
      </div>

      {/* Rejection reason */}
      {status === "rejected" && site.rejectionReason && (
        <div className="mt-2.5 flex gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2.5">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden />
          <p className="text-[11px] leading-relaxed text-destructive/90">{site.rejectionReason}</p>
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2">
        {/* Active toggle — approved sites only */}
        {isApproved ? (
          <button
            type="button"
            onClick={handleToggleActive}
            disabled={pending}
            aria-pressed={site.isActive}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60",
              site.isActive
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                : "border-border bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {site.isActive ? <Eye className="size-3.5" aria-hidden /> : <EyeOff className="size-3.5" aria-hidden />}
            {site.isActive ? "Activo" : "Inactivo"}
          </button>
        ) : <span />}

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            aria-label="Eliminar sitio"
            className="size-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); setConfirmOpen(true) }}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant={status === "rejected" ? "default" : "outline"}
            className="h-8 gap-1.5 text-xs"
            onClick={(e) => { e.stopPropagation(); onEdit(site.id) }}
          >
            <Pencil className="size-3.5" aria-hidden />
            {ctaLabel}
          </Button>
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent onClick={stop}>
          <DialogHeader>
            <DialogTitle>¿Eliminar este sitio?</DialogTitle>
            <DialogDescription>
              Se eliminará <span className="font-medium text-foreground">{site.name}</span> de forma permanente.
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={pending}>Cancelar</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={pending}
              className="gap-1.5"
            >
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.article>
  )
}
