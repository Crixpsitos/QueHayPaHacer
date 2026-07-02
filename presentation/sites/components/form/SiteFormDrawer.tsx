"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, animate, motion, useMotionValue } from "motion/react"
import {
  ArrowLeft, CheckCircle2, ChevronDown, Clock, ImageIcon,
  Info, Loader2, MapPin, Send, Star, Trash2, X,
} from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { Input } from "@/app/components/ui/input"
import { cn } from "@/app/lib/utils/cn"
import { CATEGORY_OPTIONS, WEEK_DAYS } from "../../lib/constants"
import { notify } from "@/presentation/shared/lib/notify"
import { uploadToGoogleStorage } from "@/presentation/events/lib/upload/uploadToGoogleStorage"
import { getImageData } from "@/presentation/events/lib/image/getImageData"
import { getVideoData } from "@/presentation/events/lib/video/getVideoData"
import type { SubmitState } from "../../hooks/useSiteForm"
import type {
  DaySchedule, FormErrors, MediaFormItem, SiteCategory,
  SiteFormViewModel, WeekDay,
} from "../../view-models/SiteFormViewModel"

// ── Accordion primitivo con motion ──────────────────────────────────────────

interface SectionProps {
  id: string
  title: string
  icon: React.ReactNode
  open: boolean
  onToggle: () => void
  error?: boolean
  children: React.ReactNode
}

function AccordionSection({ id, title, icon, open, onToggle, error, children }: SectionProps) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card transition-colors", error && "border-destructive/60")}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`section-${id}`}
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", error ? "bg-destructive/10 text-destructive" : "bg-accent text-primary")}>
          {icon}
        </span>
        <span className="flex-1 text-sm font-medium text-foreground">{title}</span>
        {error && <span className="text-xs text-destructive">Requerido</span>}
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`section-${id}`}
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 pb-4 pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Form sections content ────────────────────────────────────────────────────

function LocationContent({
  form, errors, addressAutoDetected, onAddressChange,
}: {
  form: SiteFormViewModel
  errors: FormErrors
  addressAutoDetected: boolean
  onAddressChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {form.coordinates ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden />
          {form.coordinates.latitude.toFixed(5)}, {form.coordinates.longitude.toFixed(5)}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Toca el mapa para ubicar tu sitio.</p>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-foreground" htmlFor="site-address">Dirección</label>
        <Input
          id="site-address"
          value={form.address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="Ej. Calle 60 #5-32, Centro"
          aria-invalid={!!errors.address}
          className="rounded-lg"
        />
        {addressAutoDetected && (
          <p className="text-[11px] text-muted-foreground">Detectada automáticamente. Puedes editarla.</p>
        )}
        {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <span className="truncate">{form.city}, {form.region}</span>
        <span className="truncate text-right">{form.country}</span>
      </div>
    </div>
  )
}

function BasicInfoContent({
  form, errors,
  onNameChange, onDescriptionChange, onCategoryChange,
}: {
  form: SiteFormViewModel
  errors: FormErrors
  onNameChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onCategoryChange: (v: SiteCategory) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-foreground" htmlFor="site-name">Nombre</label>
        <Input id="site-name" value={form.name} onChange={(e) => onNameChange(e.target.value)} placeholder="Ej. Café Berlín" aria-invalid={!!errors.name} className="rounded-lg" />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-foreground" htmlFor="site-desc">Descripción</label>
        <textarea
          id="site-desc"
          value={form.description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe brevemente el sitio..."
          rows={3}
          aria-invalid={!!errors.description}
          className={cn(
            "w-full resize-none rounded-lg border border-transparent bg-input/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-[color,box-shadow,background-color] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
            errors.description && "border-destructive",
          )}
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-foreground">Categoría</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onCategoryChange(opt.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                form.category === opt.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
      </div>
    </div>
  )
}

// ── Media upload content ─────────────────────────────────────────────────────

function MediaContent({
  media, errors,
  onReplaceCover, onAddMedia, onMediaUploaded, onUpdateMedia, onRemoveMedia, onSetCover,
  onEnsureDraftId,
}: {
  media: MediaFormItem[]
  errors: FormErrors
  onReplaceCover: (item: MediaFormItem) => void
  onAddMedia: (items: MediaFormItem[]) => void
  onMediaUploaded: (id: string, url: string, path: string) => Promise<void>
  onUpdateMedia: (id: string, partial: Partial<MediaFormItem>) => void
  onRemoveMedia: (id: string) => void
  onSetCover: (id: string) => void
  onEnsureDraftId: () => Promise<string>
}) {
  const coverInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const cover = media.find((m) => m.type === "image" && m.isCover)
  const gallery = media.filter((m) => !(m.type === "image" && m.isCover))

  const uploadFile = async (
    file: File,
    siteId: string,
    prefix: string,
  ): Promise<{ url: string; path: string }> => {
    const result = await uploadToGoogleStorage(file, "sites", siteId, {
      fileName: `${prefix}-${file.name}`,
      contentType: file.type,
      isPublic: true,
    })
    return { url: result.publicUrl, path: result.path }
  }

  const handleCoverFile = async (file: File) => {
    const id = crypto.randomUUID()
    const tempUrl = URL.createObjectURL(file)
    onReplaceCover({ id, type: "image", url: tempUrl, alt: file.name, isCover: true, status: "uploading" })

    void notify.promise(
      (async () => {
        const siteId = await onEnsureDraftId()
        const { url, path } = await uploadFile(file, siteId, "deoptimized-cover")
        URL.revokeObjectURL(tempUrl)
        await onMediaUploaded(id, url, path)  // updates state + persists to Firestore
      })(),
      {
        loading: "Subiendo portada...",
        success: () => "Portada subida",
        error: (e) => {
          onUpdateMedia(id, { status: "error" })
          return `Error: ${e?.message ?? "no se pudo subir"}`
        },
      },
    )
  }

  const handleGalleryFiles = async (files: File[]) => {
    const newItems: MediaFormItem[] = files.map((f) => ({
      id: crypto.randomUUID(),
      type: f.type.startsWith("video/") ? "video" : "image",
      url: URL.createObjectURL(f),
      alt: f.name,
      isCover: false,
      status: "uploading" as const,
    }))
    onAddMedia(newItems)

    void notify.promise(
      (async () => {
        const siteId = await onEnsureDraftId()
        await Promise.all(
          files.map(async (file, i) => {
            const item = newItems[i]
            const prefix = file.type.startsWith("video/") ? "deoptimized-video" : "deoptimized-media"
            const { url, path } = await uploadFile(file, siteId, prefix)
            URL.revokeObjectURL(item.url)
            await onMediaUploaded(item.id, url, path)  // updates state + persists to Firestore
          }),
        )
      })(),
      {
        loading: `Subiendo ${files.length > 1 ? `${files.length} archivos` : "archivo"}...`,
        success: () => "Archivos subidos",
        error: (e) => {
          newItems.forEach((it) => onUpdateMedia(it.id, { status: "error" }))
          return `Error: ${e?.message ?? "no se pudo subir"}`
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Cover — required */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <Star className="size-3.5 text-primary" aria-hidden />
          <span className="text-xs font-medium text-foreground">Imagen de portada <span className="text-destructive">*</span></span>
        </div>

        {cover ? (
          <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
            <img src={cover.url} alt={cover.alt} className="size-full object-cover" />
            {cover.status === "uploading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="size-6 animate-spin text-white" />
              </div>
            )}
            {cover.status === "processing" && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
                <Loader2 className="size-3 animate-spin" aria-hidden /> Optimizando
              </div>
            )}
            {cover.status === "error" && (
              <div className="absolute inset-0 flex items-center justify-center bg-destructive/20">
                <span className="text-xs font-medium text-destructive">Error al subir</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => onRemoveMedia(cover.id)}
              aria-label="Eliminar portada"
              className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-black/80"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className={cn(
              "flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors hover:border-primary/50 hover:bg-accent/30",
              errors.media ? "border-destructive/60 bg-destructive/5" : "border-border bg-muted/40",
            )}
          >
            <ImageIcon className={cn("size-7", errors.media ? "text-destructive" : "text-muted-foreground")} aria-hidden />
            <span className={cn("text-xs", errors.media ? "text-destructive" : "text-muted-foreground")}>
              Toca para agregar la portada
            </span>
          </button>
        )}
        {errors.media && <p className="text-xs text-destructive">{errors.media}</p>}

        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleCoverFile(file)
            e.target.value = ""
          }}
        />
      </div>

      {/* Gallery */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-foreground">Galería (fotos y videos)</span>
        <div className="grid grid-cols-3 gap-2">
          {gallery.map((m) => (
            <div key={m.id} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
              {m.type === "video" ? (
                <video src={m.url} className="size-full object-cover" muted />
              ) : (
                <img src={m.url} alt={m.alt} className="size-full object-cover" />
              )}
              {m.status === "uploading" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="size-4 animate-spin text-white" />
                </div>
              )}
              {m.status === "processing" && (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/60 py-0.5 text-[9px] font-medium text-white">
                  <Loader2 className="size-2.5 animate-spin" aria-hidden /> Optimizando
                </div>
              )}
              {m.status === "error" && (
                <div className="absolute inset-0 flex items-center justify-center bg-destructive/20">
                  <X className="size-4 text-destructive" />
                </div>
              )}
              {m.status === "ready" && m.type === "image" && (
                <button
                  type="button"
                  onClick={() => onSetCover(m.id)}
                  title="Usar como portada"
                  className="absolute left-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                >
                  <Star className="size-3" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onRemoveMedia(m.id)}
                aria-label="Eliminar"
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}

          {/* Add more */}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/30"
          >
            <ImageIcon className="size-5" aria-hidden />
            <span className="text-[10px]">Agregar</span>
          </button>
        </div>
        <input
          ref={galleryInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="sr-only"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            if (files.length) void handleGalleryFiles(files)
            e.target.value = ""
          }}
        />
      </div>
    </div>
  )
}

function ScheduleContent({
  schedule, onUpdateSchedule,
}: {
  schedule: SiteFormViewModel["schedule"]
  onUpdateSchedule: (day: WeekDay, partial: Partial<DaySchedule>) => void
}) {
  return (
    <div className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
      {WEEK_DAYS.map(({ key, label }) => {
        const day = schedule[key]
        return (
          <div key={key} className="flex items-center gap-3 px-3 py-2.5">
            <span className="w-20 shrink-0 text-xs text-muted-foreground">{label}</span>
            {day.closed ? (
              <span className="flex-1 text-xs font-medium text-destructive">Cerrado</span>
            ) : (
              <div className="flex flex-1 items-center gap-2 text-xs">
                <input
                  type="time"
                  value={day.open}
                  onChange={(e) => onUpdateSchedule(key, { open: e.target.value })}
                  className="rounded border border-border bg-background px-1.5 py-0.5 text-xs outline-none focus-visible:border-ring"
                />
                <span className="text-muted-foreground">–</span>
                <input
                  type="time"
                  value={day.close}
                  onChange={(e) => onUpdateSchedule(key, { close: e.target.value })}
                  className="rounded border border-border bg-background px-1.5 py-0.5 text-xs outline-none focus-visible:border-ring"
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => onUpdateSchedule(key, { closed: !day.closed })}
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors",
                day.closed ? "bg-muted text-muted-foreground hover:bg-accent" : "bg-destructive/10 text-destructive hover:bg-destructive/20",
              )}
            >
              {day.closed ? "Abrir" : "Cerrar"}
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ── Main drawer ──────────────────────────────────────────────────────────────

export interface SiteFormDrawerProps {
  form: SiteFormViewModel
  errors: FormErrors
  submitState: SubmitState
  coverUrl?: string
  addressAutoDetected: boolean
  isMediaProcessing: boolean
  mode?: "create" | "edit"
  isDraft?: boolean   // editando un borrador → mostrar acciones de borrador/publicar
  onBack: () => void
  onAddressChange: (v: string) => void
  onUpdateField: <K extends keyof SiteFormViewModel>(key: K, value: SiteFormViewModel[K]) => void
  onClearError: (key: keyof FormErrors) => void
  onReplaceCover: (item: MediaFormItem) => void
  onAddMedia: (items: MediaFormItem[]) => void
  onMediaUploaded: (id: string, url: string, path: string) => Promise<void>
  onUpdateMedia: (id: string, partial: Partial<MediaFormItem>) => void
  onRemoveMedia: (id: string) => void
  onSetCover: (id: string) => void
  onUpdateSchedule: (day: WeekDay, partial: Partial<DaySchedule>) => void
  onSaveDraft: () => void
  onPublish: () => void
  onReset: () => void
  onEnsureDraftId: () => Promise<string>
}

type SectionKey = "location" | "info" | "media" | "schedule"

const SECTIONS: { id: SectionKey; title: string; icon: React.ReactNode }[] = [
  { id: "location", title: "Ubicación",          icon: <MapPin className="size-4" /> },
  { id: "info",     title: "Información básica",  icon: <Info className="size-4" /> },
  { id: "media",    title: "Fotos y videos",      icon: <ImageIcon className="size-4" /> },
  { id: "schedule", title: "Horario",             icon: <Clock className="size-4" /> },
]

export function SiteFormDrawer({
  form, errors, submitState, coverUrl, addressAutoDetected, isMediaProcessing,
  mode = "create", isDraft = false,
  onBack, onAddressChange, onUpdateField, onClearError,
  onReplaceCover, onAddMedia, onMediaUploaded, onUpdateMedia, onRemoveMedia, onSetCover,
  onUpdateSchedule, onSaveDraft, onPublish, onReset, onEnsureDraftId,
}: SiteFormDrawerProps) {
  const isEdit = mode === "edit"
  // create OR editing a draft → mostrar [Guardar borrador] [Publicar]
  const showDraftActions = !isEdit || isDraft
  const [openSection, setOpenSection] = useState<SectionKey>("location")
  const [isSheetOpen, setIsSheetOpen] = useState(true)
  const [mounted, setMounted] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const y = useMotionValue(0)
  const touchStartY = useRef(0)
  const touchStartDragY = useRef(0)

  useEffect(() => { setMounted(true) }, [])

  const snapSheet = useCallback((open: boolean) => {
    const h = sheetRef.current?.clientHeight ?? 400
    animate(y, open ? 0 : h - 56, { type: "spring", stiffness: 320, damping: 32 })
    setIsSheetOpen(open)
  }, [y])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    touchStartDragY.current = y.get()
  }, [y])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - touchStartY.current
    const h = sheetRef.current?.clientHeight ?? 400
    const maxY = h - 56
    y.set(Math.max(0, Math.min(maxY, touchStartDragY.current + delta)))
  }, [y])

  const onTouchEnd = useCallback(() => {
    const h = sheetRef.current?.clientHeight ?? 400
    const maxY = h - 56
    snapSheet(y.get() < maxY * 0.45)
  }, [y, snapSheet])

  const isBusy = submitState === "saving" || submitState === "publishing"
  const hasCoverReady = form.media.some((m) => m.type === "image" && m.isCover && m.status === "ready")
  const publishDisabled = isBusy || isMediaProcessing || !hasCoverReady

  const toggle = (id: SectionKey) => setOpenSection((prev) => (prev === id ? ("" as SectionKey) : id))

  const sectionErrors: Record<SectionKey, boolean> = {
    location: !!(errors.coordinates || errors.address),
    info:     !!(errors.name || errors.description || errors.category),
    media:    !!errors.media,
    schedule: false,
  }

  // ── Desktop panel ──────────────────────────────────────────────────────────
  const panelContent = (
    <aside className="relative flex h-full w-full flex-col bg-background">
      {/* Accordion */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <div className="flex flex-col gap-2">
          {SECTIONS.map((s) => (
            <AccordionSection
              key={s.id}
              id={s.id}
              title={s.title}
              icon={s.icon}
              open={openSection === s.id}
              onToggle={() => toggle(s.id)}
              error={sectionErrors[s.id]}
            >
              {s.id === "location" && (
                <LocationContent form={form} errors={errors} addressAutoDetected={addressAutoDetected} onAddressChange={onAddressChange} />
              )}
              {s.id === "info" && (
                <BasicInfoContent
                  form={form} errors={errors}
                  onNameChange={(v) => { onUpdateField("name", v); onClearError("name") }}
                  onDescriptionChange={(v) => { onUpdateField("description", v); onClearError("description") }}
                  onCategoryChange={(v) => { onUpdateField("category", v); onClearError("category") }}
                />
              )}
              {s.id === "media" && (
                <MediaContent
                  media={form.media}
                  errors={errors}
                  onReplaceCover={onReplaceCover}
                  onAddMedia={onAddMedia}
                  onMediaUploaded={onMediaUploaded}
                  onUpdateMedia={onUpdateMedia}
                  onRemoveMedia={onRemoveMedia}
                  onSetCover={onSetCover}
                  onEnsureDraftId={onEnsureDraftId}
                />
              )}
              {s.id === "schedule" && <ScheduleContent schedule={form.schedule} onUpdateSchedule={onUpdateSchedule} />}
            </AccordionSection>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-5">
        {isEdit && isDraft && (
          <p className="mb-2 flex items-center justify-center gap-1.5 rounded-lg bg-amber-500/10 py-1 text-[11px] font-medium text-amber-600">
            Este sitio es un borrador — publícalo para enviarlo a revisión
          </p>
        )}
        <div className="flex gap-3">
          {!showDraftActions ? (
            <>
              <Button variant="outline" className="flex-1" onClick={onBack} disabled={isBusy}>Cancelar</Button>
              <Button className="flex-1" onClick={onPublish} disabled={publishDisabled}>
                {submitState === "publishing" ? <Loader2 className="size-4 animate-spin" /> : isMediaProcessing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Guardar cambios
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="flex-1" onClick={onSaveDraft} disabled={isBusy || isMediaProcessing}>
                {(submitState === "saving" || isMediaProcessing) ? <Loader2 className="size-4 animate-spin" /> : null}
                Guardar borrador
              </Button>
              <Button className="flex-1" onClick={onPublish} disabled={publishDisabled} title={!hasCoverReady ? "Agrega una imagen de portada para publicar" : undefined}>
                {submitState === "publishing" ? <Loader2 className="size-4 animate-spin" /> : isMediaProcessing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Publicar
              </Button>
            </>
          )}
        </div>
        {isMediaProcessing ? (
          <p className="mt-1.5 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
            <Loader2 className="size-3 animate-spin" aria-hidden />
            Optimizando media… no cierres esta ventana
          </p>
        ) : !hasCoverReady && !isBusy ? (
          <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
            Agrega una imagen de portada para publicar
          </p>
        ) : null}
      </div>

      {/* Success overlay */}
      <AnimatePresence>
        {submitState === "done" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-background/85 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-xl"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
                <CheckCircle2 className="size-7" />
              </span>
              <h2 className="text-base font-semibold text-foreground">
                {showDraftActions ? "¡Sitio enviado!" : "¡Cambios guardados!"}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {showDraftActions ? "Será revisado antes de aparecer en el mapa." : "Los cambios serán revisados antes de publicarse."}
              </p>
              <Button className="mt-1 w-full" onClick={onReset}>
                {isEdit ? "Volver a mis sitios" : "Agregar otro"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  )

  // ── Mobile bottom sheet ────────────────────────────────────────────────────
  return (
    <>
      {/* Desktop: sidebar derecha */}
      <div className="hidden h-full w-[420px] min-w-[380px] max-w-[480px] shrink-0 flex-col border-l border-border bg-background lg:flex">{panelContent}</div>

      {/* Mobile: portaled bottom sheet — exactly matches the panel section height */}
      {mounted && createPortal(
        <motion.div
          ref={sheetRef}
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-2xl border-t border-border bg-background shadow-2xl lg:hidden"
          style={{ height: "calc(100dvh - 42dvh)", y }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Drag pill */}
          <div
            className="flex justify-center pb-1 pt-2"
            onClick={() => snapSheet(!isSheetOpen)}
          >
            <div className="h-1 w-10 rounded-full bg-border" />
          </div>

          {/* Header — title centered absolutely so Volver/chevron don't affect it */}
          <div className="relative flex h-11 shrink-0 items-center border-b border-border px-4">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Volver
            </button>
            <span className="pointer-events-none absolute inset-x-0 text-center text-sm font-semibold text-foreground">
              {isEdit ? "Editar sitio" : "Crear sitio"}
            </span>
            <button
              type="button"
              onClick={() => snapSheet(!isSheetOpen)}
              aria-label={isSheetOpen ? "Ocultar" : "Mostrar"}
              className="ml-auto flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <ChevronDown className={cn("size-4 transition-transform duration-200", !isSheetOpen && "rotate-180")} />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
            {panelContent}
          </div>
        </motion.div>,
        document.body,
      )}
    </>
  )
}
