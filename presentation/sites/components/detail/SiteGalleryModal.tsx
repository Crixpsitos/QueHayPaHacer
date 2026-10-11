"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, Images } from "lucide-react";
import { Lightbox, type MediaSlide } from "@/presentation/events/components/detail/EventMedia";
import type { SiteMediaItem } from "@/presentation/sites/view-models/SiteFormViewModel";

// ponytail: el visor es el mismo Lightbox del detalle de evento (pausa videos,
// bloquea scroll, contador); aquí solo vive el mosaico.

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

  const coverIdx = media.indexOf(cover);
  const openAt = (idx: number) => { setStartIndex(idx); setOpen(true); };

  return (
    <>
      {open && (
        <Lightbox
          slides={media.map((m, i): MediaSlide => ({ type: m.type, url: m.url, thumbnailUrl: m.thumbnailUrl, alt: `${siteName}, foto ${i + 1}` }))}
          initial={startIndex}
          onClose={() => setOpen(false)}
        />
      )}

      {/* ── MÓVIL: portada fullwidth + grid 2 columnas debajo ───────────── */}
      <div className="sm:hidden mb-6 space-y-1">
        {/* Portada fullwidth */}
        <div className="overflow-hidden rounded-2xl border border-border">
          <button onClick={() => openAt(coverIdx)} className="relative block aspect-video w-full overflow-hidden bg-muted">
            {cover && (
              cover.type === "video" ? (
                <div className="relative h-full w-full">
                  {cover.thumbnailUrl
                    ? <Image src={cover.thumbnailUrl} alt={siteName} fill className="object-cover" priority loading="eager" fetchPriority="high" sizes="(max-width: 640px) 100vw, 640px" />
                    : <div className="h-full w-full bg-zinc-900" />}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="rounded-full bg-white/90 p-3 shadow-lg"><Play className="size-9 text-zinc-900" /></div>
                  </div>
                </div>
              ) : <Image src={cover.url} alt={siteName} fill className="object-cover" priority loading="eager" fetchPriority="high" sizes="(max-width: 640px) 100vw, 640px" />
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
          <button onClick={() => openAt(coverIdx)} className="relative block aspect-video w-full overflow-hidden bg-muted">
            {cover && (
              cover.type === "video" ? (
                <div className="relative h-full w-full">
                  {cover.thumbnailUrl
                    ? <Image src={cover.thumbnailUrl} alt={siteName} fill className="object-cover" priority loading="eager" fetchPriority="high" sizes="(max-width: 1200px) 100vw, 1152px" />
                    : <div className="h-full w-full bg-zinc-900" />}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="rounded-full bg-white/90 p-3 shadow-lg"><Play className="size-10 text-zinc-900" /></div>
                  </div>
                </div>
              ) : <Image src={cover.url} alt={siteName} fill className="object-cover" priority loading="eager" fetchPriority="high" sizes="(max-width: 1200px) 100vw, 1152px" />
            )}
          </button>
        ) : (
          /* Bento: flex horizontal — portada izquierda + sub-grid 2×2 derecha */
          <div className="flex h-85 sm:h-105 md:h-120 gap-0.5 bg-border">
            {/* Portada — columna izquierda, altura completa */}
            <button
              onClick={() => openAt(coverIdx)}
              className="relative flex-1 overflow-hidden bg-muted"
            >
              {cover && (
                cover.type === "video"
                  ? (
                    <div className="relative h-full w-full">
                      {cover.thumbnailUrl
                        ? <Image src={cover.thumbnailUrl} alt={siteName} fill className="object-cover" priority loading="eager" fetchPriority="high" sizes="(max-width: 1200px) 50vw, 576px" />
                        : <div className="h-full w-full bg-zinc-900" />}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="rounded-full bg-white/90 p-3 shadow-lg"><Play className="size-8 text-zinc-900" /></div>
                      </div>
                    </div>
                  )
                  : <Image src={cover.url} alt={siteName} fill className="object-cover hover:scale-105 transition-transform duration-300" priority loading="eager" fetchPriority="high" sizes="(max-width: 1200px) 50vw, 576px" />
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
                            ? <Image src={m.thumbnailUrl} alt={`${siteName} video ${i + 2}`} fill className="object-cover" sizes="(max-width: 1200px) 25vw, 288px" />
                            : <div className="h-full w-full bg-zinc-800" />}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="rounded-full bg-white/90 p-1.5"><Play className="size-4 text-zinc-900" /></div>
                          </div>
                        </div>
                      )
                      : <Image src={m.url} alt={`${siteName} ${i + 2}`} fill className="object-cover hover:scale-105 transition-transform duration-300" sizes="(max-width: 1200px) 25vw, 288px" />
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
