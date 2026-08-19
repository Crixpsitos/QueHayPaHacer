import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Eye, Heart, Layers, MapPin, Share2 } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";
import type { UserEvent } from "@/domain/repository/profile/IProfileRepository";
import { EventStatusBadge } from "./EventStatusBadge";

interface PublicEventCardProps {
  event: UserEvent;
  priority?: boolean;
}

const formatDateCompact = (date: Date) =>
  new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(date));

const formatDateShort = (date: Date) =>
  new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "short",
  }).format(new Date(date));

const formatCompactNumber = (value: number): string =>
  new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 }).format(value);

const getTimeState = (startDate?: Date, endDate?: Date) => {
  const now = Date.now();
  const startMs = startDate ? new Date(startDate).getTime() : undefined;
  const endMs = endDate ? new Date(endDate).getTime() : undefined;

  if (typeof endMs === "number" && now > endMs)
    return { label: "Finalizado", variant: "ended" as const };
  if (typeof startMs === "number" && now >= startMs)
    return { label: "En curso", variant: "live" as const };
  if (typeof startMs === "number" && now < startMs)
    return { label: "Próximo", variant: "upcoming" as const };
  return { label: "Fecha pendiente", variant: "pending" as const };
};

export function PublicEventCard({ event, priority = false }: PublicEventCardProps) {
  const timeState = getTimeState(event.startDate, event.endDate);
  const isPast = timeState.variant === "ended";
  const isMultiDate = event.eventType === "multi-date";
  const isFree = event.isFree;
  const views = event.analytics?.views ?? 0;
  const likes = event.analytics?.likes ?? 0;
  const shares = event.analytics?.shares ?? event.analytics?.clicks ?? 0;
  const hasStats = views > 0 || likes > 0 || shares > 0;

  const priceLabel = isFree
    ? "Gratis"
    : typeof event.priceAmount === "number"
      ? `$${event.priceAmount.toLocaleString("es-CO")}`
      : "";

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 h-full",
        "hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-hover",
        "focus-within:ring-2 focus-within:ring-primary/30 focus-within:ring-offset-2",
        isPast && "opacity-90",
      )}
    >
      {/* ── IMAGEN 4:3 ── */}
      <Link href={`/eventos/${event.id}`} className="block overflow-hidden" tabIndex={-1} aria-hidden="true">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {event.image ? (
            <Image
              src={event.image}
              alt={event.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className={cn(
                "object-cover transition-transform duration-500 group-hover:scale-[1.04]",
                isPast && "grayscale-[0.5]",
              )}
              loading={priority ? "eager" : "lazy"}
              priority={priority}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Calendar className="size-12 text-muted-foreground/20" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/65" />

          {/* Estado temporal — top-left */}
          <div className="absolute left-3 top-3">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm",
                timeState.variant === "ended"    && "bg-destructive/90 text-white",
                timeState.variant === "live"     && "bg-emerald-500/90 text-white",
                timeState.variant === "upcoming" && "bg-foreground/70 text-primary-foreground",
                timeState.variant === "pending"  && "bg-foreground/50 text-primary-foreground",
              )}
            >
              {timeState.label}
            </span>
          </div>

          {/* Bottom: estado publicación (izq) + precio (der) */}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
            <EventStatusBadge status={event.status} className="border-0 bg-background/85 backdrop-blur-sm" />
            {priceLabel && (
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold backdrop-blur-sm",
                  isFree ? "bg-emerald-500/90 text-white" : "bg-white/90 text-foreground",
                )}
              >
                {priceLabel}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* ── CONTENIDO ── */}
      <div className="flex flex-1 flex-col gap-2.5 px-4 pt-4 pb-4">

        {/* Título */}
        <Link href={`/eventos/${event.id}`}>
          <h3
            className={cn(
              "line-clamp-2 text-[17px] font-bold leading-snug transition-colors group-hover:text-primary",
              isPast ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {event.title}
          </h3>
        </Link>

        {/* Descripción — 2 líneas */}
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {event.description}
        </p>

        {/* Fecha + ubicación — sin caja, inline */}
        <div className="flex flex-col gap-1 text-[13px] text-muted-foreground">
          {isMultiDate ? (
            <div className="flex items-center gap-1.5">
              <Layers className="size-3.5 shrink-0 text-primary/70" />
              <span className="font-medium text-foreground">Varias fechas</span>
              {event.startDate && event.endDate && (
                <span>· {formatDateShort(event.startDate)} – {formatDateShort(event.endDate)}</span>
              )}
            </div>
          ) : event.startDate ? (
            <div className="flex items-center gap-1.5" suppressHydrationWarning>
              <Calendar className="size-3.5 shrink-0 text-primary/70" />
              <span suppressHydrationWarning>{formatDateCompact(event.startDate)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground/60">
              <Calendar className="size-3.5 shrink-0" />
              <span>Fecha por confirmar</span>
            </div>
          )}
          {event.location?.venue && (
            <div className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0 text-primary/70" />
              <span className="truncate">
                {event.location.venue}
                {event.location.city ? ` · ${event.location.city}` : ""}
              </span>
            </div>
          )}
        </div>

        {/* Métricas — fila compacta sin mini-cards */}
        {hasStats && (
          <div className="flex items-center gap-3 border-t border-border/50 pt-2.5 text-[12px] text-muted-foreground">
            {views > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="size-3.5" />
                {formatCompactNumber(views)}
              </span>
            )}
            {likes > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="size-3.5" />
                {formatCompactNumber(likes)}
              </span>
            )}
            {shares > 0 && (
              <span className="flex items-center gap-1">
                <Share2 className="size-3.5" />
                {formatCompactNumber(shares)}
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/eventos/${event.id}`}
          className={cn(
            "mt-auto flex items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-semibold transition-all",
            isPast
              ? "bg-muted text-muted-foreground hover:bg-border"
              : "bg-primary text-primary-foreground shadow-primary-glow hover:bg-primary-dark hover:shadow-hover",
          )}
        >
          Ver evento
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}
