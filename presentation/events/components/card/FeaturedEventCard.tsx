"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Heart, Share2, ArrowRight, Tag, Layers } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";
import { likeEventAction } from "@/app/actions/events/like-event.action";
import { shareEventAction } from "@/app/actions/events/share-event.action";
import { useAuth } from "@/app/store/auth/AuthContext";
import type { EventViewModel } from "@/presentation/events/view-models/EventViewModel";

function fmtBogo(iso: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", ...opts }).format(
    new Date(iso),
  );
}

function bogoDay(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date(iso));
}

function buildDateLabel(event: EventViewModel): string {
  const isMultiDate = event.eventType === "multi-date";
  if (isMultiDate && event.startDate && event.endDate) {
    const same = bogoDay(event.startDate) === bogoDay(event.endDate);
    if (same) return `Varias sesiones el ${fmtBogo(event.startDate, { day: "numeric", month: "short" })}`;
    return `Del ${fmtBogo(event.startDate, { day: "numeric", month: "short" })} al ${fmtBogo(event.endDate, { day: "numeric", month: "short" })}`;
  }
  if (event.startDate) {
    return fmtBogo(event.startDate, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }
  return "Fecha por confirmar";
}

interface FeaturedEventCardProps {
  event: EventViewModel;
  initialLiked?: boolean;
  prioritizeImage?: boolean;
}

export function FeaturedEventCard({ event, initialLiked = false, prioritizeImage = true }: FeaturedEventCardProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(event.analytics?.likes ?? 0);
  const [isPending, setIsPending] = useState(false);

  const href = `/eventos/${event.slug || event.id}`;
  const isMultiDate = event.eventType === "multi-date";
  const isFree = event.price?.isFree ?? event.price?.amount === 0;
  const dateLabel = buildDateLabel(event);

  const handleLike = useCallback(async () => {
    if (!user) return;
    if (isPending) return;
    setIsPending(true);
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    try {
      await likeEventAction(event.id, next);
    } catch {
      setLiked(!next);
      setLikes((n) => n + (next ? -1 : 1));
    } finally {
      setIsPending(false);
    }
  }, [user, liked, isPending, event.id]);

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
          className="relative aspect-video shrink-0 overflow-hidden bg-muted sm:aspect-auto sm:w-[42%]"
        >
          {event.mainImage?.url ? (
            <>
              <Image
                src={event.mainImage.url}
                alt={event.title}
                fill
                sizes="(max-width: 640px) 100vw, 42vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority={prioritizeImage}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-black/10" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Calendar className="size-12 text-muted-foreground/20" />
            </div>
          )}
          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {isMultiDate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-600/90 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                <Layers className="size-3" />Varias fechas
              </span>
            )}
            <span className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm",
              isFree ? "bg-emerald-500/90 text-white" : "bg-black/50 text-white"
            )}>
              {isFree ? "Gratis" : `$${(event.price?.amount ?? 0).toLocaleString("es-CO")}`}
            </span>
          </div>
        </Link>

        {/* Contenido derecha */}
        <div className="flex flex-1 flex-col justify-between p-5 sm:p-7">
          <div className="space-y-3">
            {event.categoryInfo?.title && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Tag className="size-3.5" />
                {event.categoryInfo.title}
              </div>
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
                    {event.location.venue}{event.location.city?.name ? ` · ${event.location.city.name}` : ""}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLike}
                disabled={isPending}
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
                className="ml-auto flex items-center gap-2 rounded-full bg-grad-primary px-5 py-2.5 text-sm font-semibold text-white shadow-primary-glow transition-all hover:shadow-hover"
              >
                Ver evento <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
