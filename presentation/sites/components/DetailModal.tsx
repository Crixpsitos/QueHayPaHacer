"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Heart, ImageOff, MapPin, MousePointerClick, Pencil, Play, Share2, X } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { CATEGORY_OPTIONS, STATUS_COLORS, STATUS_LABELS, WEEK_DAYS, getDisplayStatus } from "../lib/constants"
import type { SiteDetail, SiteMediaItem } from "../view-models/SiteFormViewModel"
import { cn } from "@/app/lib/utils/cn"

interface DetailModalProps {
  site: SiteDetail | null
  onClose: () => void
  onEdit: (id: string) => void
}

const fmt = (n: number) => new Intl.NumberFormat("es-CO").format(n)
const CATEGORY_LABELS = Object.fromEntries(CATEGORY_OPTIONS.map((c) => [c.value, c.label]))

export function DetailModal({ site, onClose, onEdit }: DetailModalProps) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  useEffect(() => {
    if (!site) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [site, onClose])

  // reinicia el lightbox al cambiar/cerrar el sitio
  useEffect(() => { setLightbox(null) }, [site?.id])

  // portada primero — mismo orden para bento y lightbox
  const media = [...(site?.mediaItems ?? [])].sort((a, b) => Number(b.isCover) - Number(a.isCover))

  return (
    <AnimatePresence>
      {site && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Detalle de ${site.name}`}
            initial={{ opacity: 0, scale: 0.97, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 24 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative z-10 flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute right-3 top-3 z-20 flex size-9 items-center justify-center rounded-full bg-card/90 text-foreground shadow-md backdrop-blur transition-colors hover:bg-card"
            >
              <X className="size-4.5" />
            </button>

            <div className="overflow-y-auto overscroll-contain">
              <BentoMedia items={media} name={site.name} onOpen={setLightbox} />
              <Body site={site} onEdit={onEdit} />
            </div>
          </motion.div>

          {/* Lightbox — encima del modal */}
          <AnimatePresence>
            {lightbox !== null && (
              <MediaLightbox
                items={media}
                index={lightbox}
                onClose={() => setLightbox(null)}
                onIndex={setLightbox}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  )
}

// ── Bento grid ─────────────────────────────────────────────────────────────────

function BentoMedia({ items, name, onOpen }: { items: SiteMediaItem[]; name: string; onOpen: (i: number) => void }) {
  if (items.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center gap-2 bg-muted text-muted-foreground/50 sm:h-56">
        <ImageOff className="size-8" aria-hidden />
        <span className="text-sm">Sin fotos</span>
      </div>
    )
  }

  if (items.length === 1) {
    return (
      <div className="h-52 overflow-hidden sm:h-64">
        <Cell item={items[0]} alt={name} className="h-full w-full" onClick={() => onOpen(0)} />
      </div>
    )
  }

  if (items.length === 2) {
    return (
      <div className="grid h-52 grid-cols-2 gap-0.5 overflow-hidden sm:h-64">
        <Cell item={items[0]} alt={`${name} 1`} className="h-full w-full" onClick={() => onOpen(0)} />
        <Cell item={items[1]} alt={`${name} 2`} className="h-full w-full" onClick={() => onOpen(1)} />
      </div>
    )
  }

  // 3+ — one big left, two stacked right
  return (
    <div className="grid h-52 grid-cols-5 gap-0.5 overflow-hidden sm:h-64">
      <Cell item={items[0]} alt={`${name} 1`} className="col-span-3 h-full w-full" onClick={() => onOpen(0)} />
      <div className="col-span-2 grid grid-rows-2 gap-0.5 overflow-hidden">
        <Cell item={items[1]} alt={`${name} 2`} className="h-full w-full" onClick={() => onOpen(1)} />
        <Cell
          item={items[2]}
          alt={`${name} 3`}
          className="h-full w-full"
          onClick={() => onOpen(2)}
          overlay={items.length > 3 ? `+${items.length - 3}` : undefined}
        />
      </div>
    </div>
  )
}

function Cell({ item, alt, className, onClick, overlay }: {
  item: SiteMediaItem; alt: string; className?: string; onClick: () => void; overlay?: string
}) {
  return (
    <button type="button" onClick={onClick} className={cn("group relative block overflow-hidden bg-muted", className)}>
      {item.type === "video" ? (
        <>
          <video src={item.url} muted playsInline preload="metadata" className="block h-full w-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-9 items-center justify-center rounded-full bg-black/55 backdrop-blur">
              <Play className="size-4 translate-x-px text-white" aria-hidden />
            </span>
          </span>
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.url} alt={alt} className="block h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
      )}
      {overlay && (
        <span className="absolute inset-0 flex items-center justify-center bg-foreground/50 text-sm font-semibold text-white">
          {overlay}
        </span>
      )}
    </button>
  )
}

// ── Lightbox ─────────────────────────────────────────────────────────────────

function MediaLightbox({ items, index, onClose, onIndex }: {
  items: SiteMediaItem[]; index: number; onClose: () => void; onIndex: (i: number) => void
}) {
  const count = items.length
  const item = items[index]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowLeft") onIndex((index - 1 + count) % count)
      else if (e.key === "ArrowRight") onIndex((index + 1) % count)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [index, count, onClose, onIndex])

  if (!item) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X className="size-5" />
      </button>

      <span className="absolute left-1/2 top-5 -translate-x-1/2 text-xs font-medium text-white/70 tabular-nums">
        {index + 1} / {count}
      </span>

      {count > 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onIndex((index - 1 + count) % count) }}
          aria-label="Anterior"
          className="absolute left-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <ChevronLeft className="size-6" />
        </button>
      )}

      <div className="flex max-h-[85vh] max-w-[92vw] items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {item.type === "video" ? (
          <video src={item.url} controls autoPlay playsInline className="max-h-[85vh] max-w-[92vw] rounded-lg" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt="" className="max-h-[85vh] max-w-[92vw] rounded-lg object-contain" />
        )}
      </div>

      {count > 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onIndex((index + 1) % count) }}
          aria-label="Siguiente"
          className="absolute right-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <ChevronRight className="size-6" />
        </button>
      )}
    </motion.div>
  )
}

// ── Body ───────────────────────────────────────────────────────────────────────

function Body({ site, onEdit }: { site: SiteDetail; onEdit: (id: string) => void }) {
  const status = getDisplayStatus(site.publicationStatus, site.moderationStatus)
  const color  = STATUS_COLORS[status]
  const label  = STATUS_LABELS[status]

  return (
    <div className="flex flex-col gap-5 p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold text-foreground text-balance">{site.name}</h2>
          <span className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", color.badge)}>
            <span className={cn("size-2 rounded-full", color.dotBg)} aria-hidden />
            {label}
          </span>
        </div>
        <p className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
          <span className="truncate">
            <span className="font-medium text-foreground">{CATEGORY_LABELS[site.category]}</span>
            {" · "}{site.address}
          </span>
        </p>
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed text-foreground/80">{site.description}</p>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-2">
        <Metric icon={MousePointerClick} label="Clics"       value={fmt(site.analytics.clicks)} />
        <Metric icon={Heart}             label="Likes"        value={fmt(site.analytics.likes)} />
        <Metric icon={Share2}            label="Compartidos"  value={fmt(site.analytics.shares)} />
        <Metric icon={CalendarDays}      label="Eventos"      value={fmt(site.analytics.eventCount)} />
      </div>

      {/* Schedule */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Horario</h3>
        <div className="overflow-hidden rounded-xl border border-border">
          {WEEK_DAYS.map(({ key, label }, i) => {
            const day = site.schedule[key]
            return (
              <div key={key} className={cn("flex items-center justify-between px-3 py-2 text-sm", i !== WEEK_DAYS.length - 1 && "border-b border-border")}>
                <span className="text-muted-foreground">{label}</span>
                {day.closed
                  ? <span className="font-medium text-destructive">Cerrado</span>
                  : <span className="font-medium tabular-nums text-foreground">{day.open} – {day.close}</span>
                }
              </div>
            )
          })}
        </div>
      </div>

      {/* Rejection reason */}
      {status === "rejected" && site.rejectionReason && (
        <div className="flex gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 p-3.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-destructive">Motivo del rechazo</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-destructive/90">{site.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* Author + actions */}
      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex items-center gap-2.5">
          {site.author.photoURL
            ? <img src={site.author.photoURL} alt={site.author.displayName} className="size-9 rounded-full object-cover" />
            : <span className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">{site.author.displayName.charAt(0)}</span>
          }
          <div className="text-xs">
            <p className="text-muted-foreground">Creado por</p>
            <p className="font-semibold text-foreground">{site.author.displayName}</p>
          </div>
        </div>
        <Button onClick={() => onEdit(site.id)} className="gap-1.5">
          <Pencil className="size-4" aria-hidden />
          {status === "rejected" ? "Editar y reenviar" : "Editar"}
        </Button>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-muted/40 py-3">
      <Icon className="size-4 text-primary" aria-hidden />
      <span className="text-base font-semibold tabular-nums text-foreground">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  )
}
