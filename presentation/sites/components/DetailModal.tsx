"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  AlertTriangle, CalendarDays, ChevronLeft, ChevronRight,
  Clock, Eye, EyeOff, ExternalLink, Globe, Heart,
  ImageOff, Loader2, MapPin, Pencil, Play, Share2, X,
} from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { CATEGORY_OPTIONS, STATUS_COLORS, STATUS_LABELS, WEEK_DAYS, getDisplayStatus } from "../lib/constants"
import type { SiteDetail, SiteMediaItem, WeekDay } from "../view-models/SiteFormViewModel"
import { cn } from "@/app/lib/utils/cn"
import { getEventsBySiteAction } from "@/app/actions/events/get-events-by-site.action"
import { SiteItineraryGrid } from "@/presentation/events/components/card/SiteItineraryCard"
import type { EventViewModel } from "@/presentation/events/view-models/EventViewModel"

interface DetailModalProps {
  site: SiteDetail | null
  onClose: () => void
  onEdit: (id: string) => void
}

const fmt = (n: number) => new Intl.NumberFormat("es-CO").format(n)
const CATEGORY_LABELS = Object.fromEntries(CATEGORY_OPTIONS.map((c) => [c.value, c.label]))

export function DetailModal({ site, onClose, onEdit }: DetailModalProps) {
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [siteEvents, setSiteEvents] = useState<EventViewModel[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)

  // Fetch events for the selected site; resets when site changes to avoid stale data.
  useEffect(() => {
    if (!site?.id) { setSiteEvents([]); return }
    let cancelled = false
    setEventsLoading(true)
    setSiteEvents([])
    getEventsBySiteAction(site.id).then((res) => {
      if (cancelled) return
      setSiteEvents(res.success ? res.events : [])
      setEventsLoading(false)
    })
    return () => { cancelled = true }
  }, [site?.id])

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
              <Body site={site} onEdit={onEdit} siteEvents={siteEvents} eventsLoading={eventsLoading} />
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
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/90"
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAY_ORDER: WeekDay[] = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"]

function getTodayKey(): WeekDay {
  return DAY_ORDER[new Date().getDay()]
}

function getOpenStatus(schedule: SiteDetail["schedule"]): { isOpen: boolean; label: string } {
  const key = getTodayKey()
  const sched = schedule?.[key]
  if (!sched || sched.closed) return { isOpen: false, label: "Cerrado hoy" }
  const toMins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0) }
  const cur = new Date().getHours() * 60 + new Date().getMinutes()
  const isOpen = cur >= toMins(sched.open) && cur < toMins(sched.close)
  return { isOpen, label: isOpen ? `Abierto · Cierra ${sched.close}` : `Cerrado · Abre ${sched.open}` }
}

// ── Body ───────────────────────────────────────────────────────────────────────

function Body({ site, onEdit, siteEvents, eventsLoading }: {
  site: SiteDetail
  onEdit: (id: string) => void
  siteEvents: EventViewModel[]
  eventsLoading: boolean
}) {
  const status     = getDisplayStatus(site.publicationStatus, site.moderationStatus)
  const color      = STATUS_COLORS[status]
  const label      = STATUS_LABELS[status]
  const openStatus = useMemo(() => getOpenStatus(site.schedule), [site.schedule])
  const todayKey   = getTodayKey()
  const isApproved = status === "approved"

  const hasSocial = !!(
    site.bookingUrl ||
    site.socialMedia?.instagram ||
    site.socialMedia?.facebook ||
    site.socialMedia?.tiktok ||
    site.socialMedia?.twitter ||
    site.socialMedia?.website
  )

  return (
    <div className="flex flex-col gap-0 p-5 sm:p-6">

      {/* ── Badges ──────────────────────────────────────────────── */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center rounded-full bg-[#F4F4F5] px-2.5 py-1 text-xs font-medium text-[#52525B]">
          {CATEGORY_LABELS[site.category] ?? site.category}
        </span>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", color.badge)}>
          <span className={cn("size-1.5 rounded-full", color.dotBg)} aria-hidden />
          {label}
        </span>
        {isApproved && (
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
            site.isActive
              ? "bg-emerald-500/10 text-emerald-700"
              : "bg-[#F4F4F5] text-[#71717A]",
          )}>
            {site.isActive
              ? <Eye className="size-3" aria-hidden />
              : <EyeOff className="size-3" aria-hidden />
            }
            {site.isActive ? "Activo" : "Inactivo"}
          </span>
        )}
      </div>

      {/* ── Alerta cierre temporal ──────────────────────────────── */}
      {site.temporarilyClosed?.isClosed && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-amber-700">Cerrado temporalmente</p>
            {site.temporarilyClosed.reason && (
              <p className="mt-0.5 text-xs leading-relaxed text-amber-600">{site.temporarilyClosed.reason}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Nombre ──────────────────────────────────────────────── */}
      <h2
        className="text-2xl font-bold leading-tight text-[#09090B] sm:text-[1.65rem]"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {site.name}
      </h2>

      {/* ── Dirección + estado de apertura ──────────────────────── */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="flex items-center gap-1.5 text-sm text-[#71717A]">
          <MapPin className="size-3.5 shrink-0 text-[#E63946]" aria-hidden />
          {site.address}
        </span>
        <span className={cn(
          "flex items-center gap-1.5 text-xs font-medium",
          openStatus.isOpen ? "text-emerald-700" : "text-[#71717A]",
        )}>
          <Clock className="size-3.5 shrink-0" aria-hidden />
          {openStatus.label}
        </span>
      </div>

      {/* ── Separador ───────────────────────────────────────────── */}
      <div className="my-5 h-px bg-[#F4F4F5]" role="separator" />

      {/* ── Sobre este lugar ────────────────────────────────────── */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-[#09090B]" style={{ fontFamily: "var(--font-heading)" }}>
          Sobre este lugar
        </h3>
        {site.description ? (
          <p className="text-sm leading-relaxed text-[#52525B]">{site.description}</p>
        ) : (
          <p className="text-sm italic text-[#A1A1AA]">Sin descripción disponible.</p>
        )}
      </section>

      {/* ── Separador ───────────────────────────────────────────── */}
      <div className="my-5 h-px bg-[#F4F4F5]" role="separator" />

      {/* ── Métricas ─────────────────────────────────────────────  */}
      <div className="grid grid-cols-4 gap-2">
        <Metric icon={Eye}          label="Visitas"      value={fmt(site.views ?? 0)} />
        <Metric icon={Heart}        label="Likes"        value={fmt(site.analytics.likes)} />
        <Metric icon={Share2}       label="Compartidos"  value={fmt(site.analytics.shares)} />
        <Metric icon={CalendarDays} label="Eventos"      value={fmt(site.analytics.eventCount)} />
      </div>

      {/* ── Separador ───────────────────────────────────────────── */}
      <div className="my-5 h-px bg-[#F4F4F5]" role="separator" />

      {/* ── Horario ──────────────────────────────────────────────── */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-[#09090B]" style={{ fontFamily: "var(--font-heading)" }}>
          Horario
        </h3>
        <div className="overflow-hidden rounded-xl border border-[#E4E4E7]">
          {WEEK_DAYS.map(({ key, label: dayLabel }, i) => {
            const day     = site.schedule?.[key]
            const isToday = key === todayKey
            return (
              <div
                key={key}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 text-sm",
                  i !== WEEK_DAYS.length - 1 && "border-b border-[#F4F4F5]",
                  isToday && "bg-[#FDF2F4]",
                )}
              >
                <span className={cn("font-medium", isToday ? "text-[#E63946]" : "text-[#52525B]")}>
                  {dayLabel}
                  {isToday && <span className="ml-1.5 text-[10px] font-semibold text-[#E63946]">hoy</span>}
                </span>
                {!day || day.closed
                  ? <span className="text-xs font-semibold text-[#E63946]">Cerrado</span>
                  : <span className={cn("tabular-nums text-xs font-semibold", isToday ? "text-[#E63946]" : "text-[#09090B]")}>
                      {day.open} – {day.close}
                    </span>
                }
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Motivo de rechazo ────────────────────────────────────── */}
      {status === "rejected" && site.rejectionReason && (
        <div className="mt-5 flex gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 p-3.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-destructive">Motivo del rechazo</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-destructive/90">{site.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* ── Redes y reservas ─────────────────────────────────────── */}
      {hasSocial && (
        <>
          <div className="my-5 h-px bg-[#F4F4F5]" role="separator" />
          <section>
            <h3 className="mb-3 text-sm font-semibold text-[#09090B]" style={{ fontFamily: "var(--font-heading)" }}>
              Redes y reservas
            </h3>
            <div className="flex flex-wrap gap-2">
              {site.bookingUrl && (
                <a
                  href={site.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E63946] bg-[#FDF2F4] px-3 py-1.5 text-xs font-semibold text-[#E63946] transition-colors hover:bg-[#E63946] hover:text-white"
                >
                  <ExternalLink className="size-3.5" aria-hidden />
                  Reservar
                </a>
              )}
              {site.socialMedia?.website && (
                <SocialLink href={site.socialMedia.website} label="Sitio web" icon={<Globe className="size-3.5" />} />
              )}
              {site.socialMedia?.instagram && (
                <SocialLink href={site.socialMedia.instagram} label="Instagram"
                  icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-3.5" aria-hidden><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>}
                />
              )}
              {site.socialMedia?.facebook && (
                <SocialLink href={site.socialMedia.facebook} label="Facebook"
                  icon={<svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>}
                />
              )}
              {site.socialMedia?.tiktok && (
                <SocialLink href={site.socialMedia.tiktok} label="TikTok"
                  icon={<svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.83a8.16 8.16 0 004.77 1.52V6.87a4.85 4.85 0 01-1-.18z"/></svg>}
                />
              )}
              {site.socialMedia?.twitter && (
                <SocialLink href={site.socialMedia.twitter} label="X (Twitter)"
                  icon={<svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>}
                />
              )}
            </div>
          </section>
        </>
      )}

      {/* ── Separador ───────────────────────────────────────────── */}
      <div className="my-5 h-px bg-[#F4F4F5]" role="separator" />

      {/* ── Itinerario del sitio ─────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#FDF2F4]">
            <CalendarDays className="size-4 text-[#E63946]" aria-hidden />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#09090B]" style={{ fontFamily: "var(--font-heading)" }}>
              Itinerario del sitio
            </h3>
            <p className="text-xs text-[#71717A]">Eventos que se realizan en {site.name}</p>
          </div>
          {siteEvents.length > 0 && (
            <span className="ml-auto rounded-full bg-[#F4F4F5] px-2.5 py-0.5 text-xs font-semibold text-[#71717A]">
              {siteEvents.length}
            </span>
          )}
        </div>

        {eventsLoading ? (
          <div className="flex items-center justify-center py-10 text-[#A1A1AA]">
            <Loader2 className="size-5 animate-spin" aria-hidden />
          </div>
        ) : (
          <SiteItineraryGrid
            events={siteEvents}
            emptyMessage="No hay eventos programados en este sitio."
          />
        )}
      </section>

      {/* ── Separador ───────────────────────────────────────────── */}
      <div className="my-5 h-px bg-[#F4F4F5]" role="separator" />

      {/* ── Autor + acciones ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {site.author.photoURL
            ? <img src={site.author.photoURL} alt={site.author.displayName} className="size-9 rounded-full object-cover ring-2 ring-[#F4F4F5]" />
            : (
              <span className="flex size-9 items-center justify-center rounded-full bg-[#FDF2F4] text-sm font-bold text-[#E63946]">
                {site.author.displayName.charAt(0).toUpperCase()}
              </span>
            )
          }
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A1A1AA]">Creado por</p>
            <p className="text-sm font-semibold text-[#09090B]">{site.author.displayName}</p>
          </div>
        </div>
        <Button
          onClick={() => onEdit(site.id)}
          className="gap-1.5 bg-[#E63946] text-white shadow-primary-glow hover:bg-[#9B0A26]"
        >
          <Pencil className="size-4" aria-hidden />
          {status === "rejected" ? "Editar y reenviar" : "Editar sitio"}
        </Button>
      </div>
    </div>
  )
}

function SocialLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex items-center gap-1.5 rounded-full border border-[#E4E4E7] bg-white px-3 py-1.5 text-xs font-medium text-[#52525B] transition-colors hover:border-[#09090B] hover:text-[#09090B]"
    >
      {icon}
      {label}
    </a>
  )
}

function Metric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-[#E4E4E7] bg-[#FAFAFC] py-3 shadow-card">
      <Icon className="size-4 text-[#E63946]" aria-hidden />
      <span className="text-base font-bold tabular-nums text-[#09090B]">{value}</span>
      <span className="text-[11px] text-[#71717A]">{label}</span>
    </div>
  )
}
