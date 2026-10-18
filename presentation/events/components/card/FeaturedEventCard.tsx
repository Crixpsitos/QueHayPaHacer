"use client";

import { useState, useCallback } from "react";
import { useOptimisticLike } from "@/presentation/shared/hooks/useOptimisticLike";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Heart, Share2, Layers } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";
import { likeEventAction } from "@/app/actions/events/like-event.action";
import { shareEventAction } from "@/app/actions/events/share-event.action";
import { useAuth } from "@/app/store/auth/AuthContext";
import { setLikedId } from "@/app/lib/clientCache/likedIds";
import { useStoredLiked } from "@/app/lib/clientCache/useStoredLiked";
import type { EventViewModel } from "@/presentation/events/view-models/EventViewModel";
import { formatPrice } from "../detail/format";
import { dateLine, PosterFallback } from "./EventCard";

interface FeaturedEventCardProps {
  event: EventViewModel;
  initialLiked?: boolean;
  prioritizeImage?: boolean;
}

export function FeaturedEventCard({ event, initialLiked = false, prioritizeImage = true }: FeaturedEventCardProps) {
  const { user } = useAuth();
  // Optimista: corazón y contador cambian al instante; si el servidor rechaza, vuelven solos.
  const storedLiked = useStoredLiked("events", user?.uid, event.id);
  const { liked, count: likes, toggle } = useOptimisticLike(initialLiked || storedLiked, event.analytics?.likes ?? 0, async (next) => {
    if (!user) return false;
    try {
      const res = await likeEventAction(event.id, next);
      if (res?.success) setLikedId("events", user.uid, event.id, next);
      return Boolean(res?.success);
    } catch {
      return false;
    }
  });

  const href = `/eventos/${event.slug || event.id}`;
  const isMultiDate = event.eventType === "multi-date";
  const dateLabel = dateLine(event);
  const [imageFailed, setImageFailed] = useState(false);

  const handleShare = useCallback(async () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/eventos/${event.slug || event.id}`;
    try {
      await navigator.share({ title: event.title, url });
    } catch {
      await navigator.clipboard.writeText(url);
    }
    void shareEventAction(event.id);
  }, [event]);

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-hover">
      <div className="flex flex-col sm:flex-row">
        {/* Imagen izquierda — aspect-video en mobile, altura flexible en desktop */}
        <Link
          href={href}
          className="relative aspect-video shrink-0 overflow-hidden bg-muted sm:aspect-auto sm:min-h-72 sm:w-[42%]"
        >
          {event.mainImage?.url && !imageFailed ? (
              <Image
                src={event.mainImage.url}
                alt={event.title}
                fill
                sizes="(max-width: 640px) 100vw, 42vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                loading={prioritizeImage ? "eager" : "lazy"}
                onError={() => setImageFailed(true)}
              />
          ) : (
            <PosterFallback title={event.title} />
          )}
          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {isMultiDate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-foreground/80 px-2.5 py-1 text-[11px] font-semibold text-primary-foreground backdrop-blur-sm">
                <Layers className="size-3" />Varias fechas
              </span>
            )}
            {!isMultiDate && event.price && (
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#09090B] tabular-nums">
                {formatPrice(event.price)}
              </span>
            )}
          </div>
        </Link>

        {/* Contenido derecha */}
        <div className="flex flex-1 flex-col justify-between p-5 sm:p-7">
          <div className="space-y-3">
            {event.categoryInfo?.title && (
              <p className="text-xs font-semibold text-primary">{event.categoryInfo.title}</p>
            )}
            <Link href={href}>
              <h2 className="line-clamp-2 text-xl font-bold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-2xl">
                {event.title}
              </h2>
            </Link>
            {event.shortDescription && (
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {event.shortDescription}
              </p>
            )}
          </div>

          <div className="mt-5 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 font-medium text-foreground" suppressHydrationWarning>
                <Calendar className="size-4 shrink-0 text-primary" />
                {dateLabel}
              </div>
              {!isMultiDate && event.location?.venue && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-4 shrink-0 text-primary" />
                  <span className="truncate">
                    {event.location.venue}{event.location.city?.name ? `, ${event.location.city.name}` : ""}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => user && toggle()}
                aria-pressed={liked}
                aria-label={liked ? "Quitar like" : "Dar like"}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors",
                  liked
                    ? "bg-[#FDF2F4] text-[#E63946]"
                    : "border border-border text-muted-foreground hover:bg-muted",
                )}
              >
                <Heart className={cn("size-4", liked && "fill-current")} />
                {likes.toLocaleString("es-CO")}
              </button>
              <button
                type="button"
                onClick={handleShare}
                aria-label="Compartir"
                className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                <Share2 className="size-4" />
              </button>
              <Link
                href={href}
                className="ml-auto flex items-center rounded-full bg-[#E63946] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#C92F3B]"
              >
                Ver evento
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
