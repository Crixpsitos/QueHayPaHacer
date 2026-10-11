"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/app/components/ui/carousel";
import { cn } from "@/app/lib/utils/cn";
import type { MediaItem, MediaImageItem, MediaVideoItem } from "@/domain/entities/events/value-objects/Media";
import type { EventViewModel } from "../../view-models/EventViewModel";

export interface MediaSlide {
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string;
  alt?: string;
}

/** Slide 0 = imagen principal (si hay); luego la galería en orden. */
export function buildSlides(mainImage: EventViewModel["mainImage"], media: MediaItem[]): MediaSlide[] {
  const slides: MediaSlide[] = [];
  if (mainImage?.url) slides.push({ type: "image", url: mainImage.url, alt: "Imagen principal" });
  for (const item of media) {
    if (item.type === "image") {
      const img = item as MediaImageItem;
      slides.push({ type: "image", url: img.data.url, alt: img.data.alt });
    } else {
      const vid = item as MediaVideoItem;
      const url = vid.data.url || vid.data.temporaryUrl || "";
      if (url) slides.push({ type: "video", url, thumbnailUrl: vid.data.thumbnailUrl });
    }
  }
  return slides;
}

const navBtn =
  "absolute z-20 flex size-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30";

export function Lightbox({ slides, initial, onClose }: { slides: MediaSlide[]; initial: number; onClose: () => void }) {
  const [api, setApi] = useState<CarouselApi>();
  const [idx, setIdx] = useState(initial);

  useEffect(() => {
    if (!api) return;
    api.scrollTo(initial, true);
    const onSelect = () => setIdx(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, initial]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") api?.scrollPrev();
      if (e.key === "ArrowRight") api?.scrollNext();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [api, onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Galería" className="fixed inset-0 z-50 flex items-center justify-center bg-black/95" onClick={onClose}>
      <button className={cn(navBtn, "right-4 top-4")} onClick={onClose} aria-label="Cerrar galería">
        <X className="size-5" />
      </button>

      {slides.length > 1 && (
        <>
          <button className={cn(navBtn, "left-2 sm:left-4")} onClick={(e) => { e.stopPropagation(); api?.scrollPrev(); }} aria-label="Anterior">
            <ChevronLeft className="size-6" />
          </button>
          <button className={cn(navBtn, "right-2 sm:right-4")} onClick={(e) => { e.stopPropagation(); api?.scrollNext(); }} aria-label="Siguiente">
            <ChevronRight className="size-6" />
          </button>
        </>
      )}

      <div className="h-full w-full" onClick={(e) => e.stopPropagation()}>
        <Carousel setApi={setApi} opts={{ loop: true, dragFree: false }} className="h-full w-full">
          <CarouselContent className="ml-0 h-full">
            {slides.map((slide, i) => (
              <CarouselItem key={i} className="flex h-full items-center justify-center px-14 py-4 pl-0 sm:px-20">
                {slide.type === "image" ? (
                  <div className="relative h-full max-h-[90vh] w-full">
                    <Image src={slide.url} alt={slide.alt || ""} fill className="object-contain" sizes="100vw" loading={i === initial ? "eager" : "lazy"} />
                  </div>
                ) : (
                  <video
                    key={slide.url}
                    src={slide.url}
                    controls
                    autoPlay={i === initial}
                    playsInline
                    poster={slide.thumbnailUrl}
                    preload="metadata"
                    className="max-h-[88vh] w-full max-w-full rounded-lg"
                  />
                )}
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {slides.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Ir a la imagen ${i + 1}`}
              className={cn("pointer-events-auto h-1.5 rounded-full transition-all", i === idx ? "w-6 bg-white" : "w-1.5 bg-white/40")}
              onClick={(e) => { e.stopPropagation(); api?.scrollTo(i); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const STRIP_MAX = 4;

/** Tira de la galería (sin la imagen principal, que ya es el hero). */
export function MediaStrip({ slides, offset, onOpen }: { slides: MediaSlide[]; offset: number; onOpen: (index: number) => void }) {
  const items = slides.slice(offset);
  if (items.length === 0) return null;
  const visible = items.slice(0, STRIP_MAX);
  const hidden = items.length - visible.length;

  return (
    <section aria-labelledby="galeria" className="space-y-4">
      <h2 id="galeria" className="font-heading text-2xl font-semibold tracking-tight text-[#09090B]">
        Fotos y videos
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {visible.map((s, i) => {
          const thumb = s.type === "video" ? s.thumbnailUrl : s.url;
          const more = i === visible.length - 1 && hidden > 0;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onOpen(offset + i)}
              aria-label={more ? `Ver ${hidden + 1} elementos más` : s.type === "video" ? "Ver video" : `Ver imagen${s.alt ? `: ${s.alt}` : ""}`}
              className="group relative aspect-square overflow-hidden rounded-2xl bg-[#18181B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946] focus-visible:ring-offset-2"
            >
              {thumb && <Image src={thumb} alt="" fill sizes="(max-width: 640px) 50vw, 200px" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />}
              {s.type === "video" && !more && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex size-9 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm">
                    <Play className="size-4 fill-white text-white" aria-hidden="true" />
                  </span>
                </span>
              )}
              {more && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/60 font-heading text-2xl font-semibold text-white tabular-nums">
                  +{hidden + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
