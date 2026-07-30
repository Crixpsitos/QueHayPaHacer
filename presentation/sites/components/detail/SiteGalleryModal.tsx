"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Play, Images } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";
import type { SiteMediaItem } from "@/presentation/sites/view-models/SiteFormViewModel";

interface SiteGalleryModalProps {
  media: SiteMediaItem[];
  siteName: string;
  /** Índice inicial al abrir (0 = portada) */
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

  // Resetear índice al abrir
  useEffect(() => {
    if (open) setCurrent(initialIndex);
  }, [open, initialIndex]);

  const prev = useCallback(() => setCurrent((i) => (i - 1 + media.length) % media.length), [media.length]);
  const next = useCallback(() => setCurrent((i) => (i + 1) % media.length), [media.length]);

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

  const item = media[current];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-label={`Galería de ${siteName}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 text-white/70">
        <div className="flex items-center gap-2 text-sm">
          <Images className="size-4" />
          <span>{siteName}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm tabular-nums">
            {current + 1} / {media.length}
          </span>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-white/10 transition-colors"
            aria-label="Cerrar galería"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* Vista principal */}
      <div className="relative flex-1 flex items-center justify-center px-4 pb-2">
        {/* Anterior */}
        {media.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-2 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors md:left-4"
            aria-label="Anterior"
          >
            <ChevronLeft className="size-6" />
          </button>
        )}

        {/* Media */}
        <div className="relative flex h-full w-full max-h-[75vh] max-w-5xl items-center justify-center mx-auto">
          {item.type === "video" ? (
            <video
              key={item.url}
              src={item.url}
              poster={item.thumbnailUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[75vh] max-w-full rounded-lg object-contain"
            />
          ) : (
            <div className="relative h-full w-full" style={{ minHeight: "300px" }}>
              <Image
                src={item.url}
                alt={`${siteName} — foto ${current + 1}`}
                fill
                className="object-contain rounded-lg"
                sizes="(max-width: 768px) 100vw, 80vw"
                priority
              />
            </div>
          )}
        </div>

        {/* Siguiente */}
        {media.length > 1 && (
          <button
            onClick={next}
            className="absolute right-2 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors md:right-4"
            aria-label="Siguiente"
          >
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>

      {/* Tira de miniaturas */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-4 pt-2 scrollbar-none">
        {media.map((m, i) => (
          <button
            key={m.id}
            onClick={() => setCurrent(i)}
            className={cn(
              "relative shrink-0 size-16 overflow-hidden rounded-lg border-2 transition-all",
              i === current ? "border-white scale-105" : "border-transparent opacity-60 hover:opacity-100",
            )}
          >
            {m.type === "video" ? (
              <div className="flex h-full items-center justify-center bg-zinc-800">
                <Play className="size-5 text-white" />
              </div>
            ) : (
              <Image src={m.url} alt="" fill className="object-cover" sizes="64px" />
            )}
            {m.isCover && (
              <span className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 text-[9px] text-white">
                portada
              </span>
            )}
          </button>
        ))}
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

      <div className="mb-6 overflow-hidden rounded-2xl border border-border">
        {rest.length === 0 ? (
          /* Solo portada */
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
          <div className="grid grid-cols-2 gap-0.5 bg-border">
            {/* Portada grande */}
            <button
              onClick={() => openAt(0)}
              className="relative row-span-2 min-h-64 overflow-hidden bg-muted sm:min-h-80"
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

            {/* Miniaturas */}
            <div className="grid grid-cols-2 gap-0.5">
              {rest.map((m, i) => {
                const mediaIdx = media.indexOf(m);
                const isLast = i === rest.length - 1 && remaining > 0;
                return (
                  <button
                    key={m.id}
                    onClick={() => openAt(mediaIdx)}
                    className="relative aspect-square overflow-hidden bg-muted"
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
                    {/* Overlay "+N más" en la última miniatura visible */}
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
