"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Play, Images } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/app/lib/utils/cn";
import type { SiteMediaItem } from "@/presentation/sites/view-models/SiteFormViewModel";

const MAX_THUMBNAILS = 10;

interface SiteGalleryModalProps {
  media: SiteMediaItem[];
  siteName: string;
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

export function SiteGalleryModal({
  media,
  siteName,
  initialIndex = 0,
  open,
  onClose,
}: SiteGalleryModalProps) {
  const [current, setCurrent] = useState(initialIndex);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, startIndex: initialIndex });

  // Sincronizar índice cuando Embla cambia de slide
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrent(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  // Al abrir, saltar al índice inicial
  useEffect(() => {
    if (open && emblaApi) {
      emblaApi.scrollTo(initialIndex, true);
      setCurrent(initialIndex);
    }
  }, [open, initialIndex, emblaApi]);

  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const goTo = useCallback((i: number) => {
    emblaApi?.scrollTo(i);
    setCurrent(i);
  }, [emblaApi]);

  // Teclado
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, prev, next, onClose]);

  if (!open || media.length === 0) return null;

  const visibleThumbs = media.slice(0, MAX_THUMBNAILS);
  const hiddenCount = media.length - MAX_THUMBNAILS;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-label={`Galería de ${siteName}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 text-white/80">
        <div className="flex items-center gap-2 text-sm sm:text-base">
          <Images className="size-5" />
          <span className="truncate font-medium">{siteName}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm sm:text-base tabular-nums whitespace-nowrap text-white/60">
            {current + 1} / {media.length}
          </span>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-10 rounded-full hover:bg-white/15 transition-colors active:bg-white/20"
            aria-label="Cerrar galería"
          >
            <X className="size-6" />
          </button>
        </div>
      </div>

      {/* Carrusel principal con Embla (swipe nativo + animación slide) */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <div ref={emblaRef} className="h-full w-full overflow-hidden">
          <div className="flex h-full">
            {media.map((item, i) => (
              <div key={item.id} className="relative flex-none w-full h-full flex items-center justify-center px-10 sm:px-16">
                {item.type === "video" ? (
                  <video
                    src={item.url}
                    poster={item.thumbnailUrl}
                    controls
                    autoPlay={i === current}
                    playsInline
                    className="max-h-[68vh] max-w-full rounded-lg object-contain"
                  />
                ) : (
                  <div className="relative w-full h-full" style={{ minHeight: 220 }}>
                    <Image
                      src={item.url}
                      alt={`${siteName} — foto ${i + 1}`}
                      fill
                      className="object-contain rounded-lg"
                      sizes="(max-width: 768px) 95vw, 85vw"
                      priority={i === initialIndex}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Botones prev/next */}
        {media.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-1 sm:left-2 md:left-4 z-10 flex items-center justify-center size-9 sm:size-10 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="size-5 sm:size-6" />
            </button>
            <button
              onClick={next}
              className="absolute right-1 sm:right-2 md:right-4 z-10 flex items-center justify-center size-9 sm:size-10 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label="Siguiente"
            >
              <ChevronRight className="size-5 sm:size-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails — flex-wrap, máximo 10, luego indicador "+N" */}
      <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 pb-3 sm:pb-4 pt-2">
        {visibleThumbs.map((m, i) => (
          <button
            key={m.id}
            onClick={() => goTo(i)}
            className={cn(
              "relative shrink-0 size-14 sm:size-16 overflow-hidden rounded-lg border-2 transition-all",
              i === current ? "border-white scale-105" : "border-transparent opacity-50 hover:opacity-90",
            )}
          >
            {m.type === "video" ? (
              <div className="flex h-full items-center justify-center bg-zinc-800">
                <Play className="size-4 text-white" />
              </div>
            ) : (
              <Image src={m.url} alt="" fill className="object-cover" sizes="64px" />
            )}
            {m.isCover && (
              <span className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-0.5 text-[9px] text-white leading-tight">
                portada
              </span>
            )}
          </button>
        ))}
        {hiddenCount > 0 && (
          <div className="flex size-14 sm:size-16 shrink-0 flex-col items-center justify-center rounded-lg bg-zinc-800 text-white opacity-70">
            <Images className="size-4" />
            <span className="text-[10px] font-semibold mt-0.5">+{hiddenCount}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Trigger para el bento grid ─────────────────────────────────────────────────

interface SiteGalleryTriggerProps {
  media: SiteMediaItem[];
  siteName: string;
  maxVisible?: number;
}

export function SiteGalleryTrigger({ media, siteName, maxVisible = 5 }: SiteGalleryTriggerProps) {
  const [open, setOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  if (media.length === 0) return null;

  const cover = media.find((m) => m.isCover) ?? media[0];
  const rest = media.filter((m) => m !== cover).slice(0, maxVisible - 1);
  const remaining = media.length - maxVisible;

  const openAt = (idx: number) => { setStartIndex(idx); setOpen(true); };

  return (
    <>
      <SiteGalleryModal
        media={media}
        siteName={siteName}
        initialIndex={startIndex}
        open={open}
        onClose={() => setOpen(false)}
      />

      {/* ── MÓVIL: portada fullwidth + grid 2 columnas debajo ───────────── */}
      <div className="sm:hidden mb-6 space-y-1">
        {/* Portada fullwidth */}
        <div className="overflow-hidden rounded-2xl border border-border">
          <button onClick={() => openAt(0)} className="relative block aspect-video w-full overflow-hidden bg-muted">
            {cover && (
              cover.type === "video" ? (
                <div className="relative h-full w-full">
                  {cover.thumbnailUrl
                    ? <Image src={cover.thumbnailUrl} alt={siteName} fill className="object-cover" priority loading="eager" fetchPriority="high" sizes="100vw" />
                    : <div className="h-full w-full bg-zinc-900" />}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="rounded-full bg-white/90 p-3 shadow-lg"><Play className="size-9 text-zinc-900" /></div>
                  </div>
                </div>
              ) : <Image src={cover.url} alt={siteName} fill className="object-cover" priority loading="eager" fetchPriority="high" sizes="100vw" />
            )}
          </button>
        </div>

        {/* Miniaturas en grid 2 columnas */}
        {rest.length > 0 && (
          <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-2xl border border-border bg-border">
            {rest.map((m, i) => {
              const mediaIdx = media.indexOf(m);
              const isLast = i === rest.length - 1 && remaining > 0;
              return (
                <button
                  key={m.id}
                  onClick={() => openAt(mediaIdx)}
                  className="relative aspect-video overflow-hidden bg-muted"
                >
                  {m.type === "video"
                    ? (
                      <div className="relative h-full w-full">
                        {m.thumbnailUrl
                          ? <Image src={m.thumbnailUrl} alt={`${siteName} video ${i + 2}`} fill className="object-cover" sizes="50vw" />
                          : <div className="h-full w-full bg-zinc-800" />}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="rounded-full bg-white/90 p-1"><Play className="size-3 text-zinc-900" /></div>
                        </div>
                      </div>
                    )
                    : <Image src={m.url} alt={`${siteName} ${i + 2}`} fill className="object-cover" sizes="50vw" />
                  }
                  {isLast && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/60 text-white">
                      <Images className="size-4" />
                      <span className="text-xs font-semibold">+{remaining + 1} más</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── DESKTOP (sm+): bento grid — NO TOCAR ────────────────────────── */}
      <div className="hidden sm:block mb-6 overflow-hidden rounded-2xl border border-border">
        {rest.length === 0 ? (
          <button onClick={() => openAt(0)} className="relative block aspect-video w-full overflow-hidden bg-muted">
            {cover && (
              cover.type === "video" ? (
                <div className="relative h-full w-full">
                  {cover.thumbnailUrl
                    ? <Image src={cover.thumbnailUrl} alt={siteName} fill className="object-cover" priority loading="eager" fetchPriority="high" sizes="100vw" />
                    : <div className="h-full w-full bg-zinc-900" />}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="rounded-full bg-white/90 p-3 shadow-lg"><Play className="size-10 text-zinc-900" /></div>
                  </div>
                </div>
              ) : <Image src={cover.url} alt={siteName} fill className="object-cover" priority loading="eager" fetchPriority="high" sizes="100vw" />
            )}
          </button>
        ) : (
          /* Bento: flex horizontal — portada izquierda + sub-grid 2×2 derecha */
          <div className="flex h-85 sm:h-105 md:h-120 gap-0.5 bg-border">
            {/* Portada — columna izquierda, altura completa */}
            <button
              onClick={() => openAt(0)}
              className="relative flex-1 overflow-hidden bg-muted"
            >
              {cover && (
                cover.type === "video"
                  ? (
                    <div className="relative h-full w-full">
                      {cover.thumbnailUrl
                        ? <Image src={cover.thumbnailUrl} alt={siteName} fill className="object-cover" priority loading="eager" fetchPriority="high" sizes="50vw" />
                        : <div className="h-full w-full bg-zinc-900" />}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="rounded-full bg-white/90 p-3 shadow-lg"><Play className="size-8 text-zinc-900" /></div>
                      </div>
                    </div>
                  )
                  : <Image src={cover.url} alt={siteName} fill className="object-cover hover:scale-105 transition-transform duration-300" priority loading="eager" fetchPriority="high" sizes="50vw" />
              )}
            </button>

            {/* Columna derecha — sub-grid 2×2 */}
            <div className="grid grid-cols-2 grid-rows-2 flex-1 gap-0.5">
              {rest.map((m, i) => {
                const mediaIdx = media.indexOf(m);
                const isLast = i === rest.length - 1 && remaining > 0;
                return (
                  <button
                    key={m.id}
                    onClick={() => openAt(mediaIdx)}
                    className="relative overflow-hidden bg-muted"
                  >
                    {m.type === "video"
                      ? (
                        <div className="relative h-full w-full">
                          {m.thumbnailUrl
                            ? <Image src={m.thumbnailUrl} alt={`${siteName} video ${i + 2}`} fill className="object-cover" sizes="25vw" />
                            : <div className="h-full w-full bg-zinc-800" />}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="rounded-full bg-white/90 p-1.5"><Play className="size-4 text-zinc-900" /></div>
                          </div>
                        </div>
                      )
                      : <Image src={m.url} alt={`${siteName} ${i + 2}`} fill className="object-cover hover:scale-105 transition-transform duration-300" sizes="25vw" />
                    }
                    {isLast && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 text-white">
                        <Images className="size-5" />
                        <span className="text-sm font-semibold">+{remaining + 1} más</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
