import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Eye, Heart, MapPin, Share2 } from "lucide-react";
import { MagicCard } from "@/app/components/ui/magic-card";
import { ShimmerButton } from "@/app/components/ui/shimmer-button";
import { cn } from "@/app/lib/utils/cn";
import type { UserEvent } from "@/domain/repository/profile/IProfileRepository";
import { EventStatusBadge } from "./EventStatusBadge";

interface PublicEventCardProps {
  event: UserEvent;
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(date),
  );

const formatCompactNumber = (value: number): string =>
  new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 }).format(value);

const getTimeState = (startDate?: Date, endDate?: Date) => {
  const now = Date.now();
  const startMs = startDate ? new Date(startDate).getTime() : undefined;
  const endMs = endDate ? new Date(endDate).getTime() : undefined;

  if (typeof endMs === "number" && now > endMs) {
    return { label: "Finalizado", className: "bg-zinc-900/80 text-white" };
  }
  if (typeof startMs === "number" && now < startMs) {
    return { label: "Próximo", className: "bg-sky-500/90 text-white" };
  }
  if (typeof startMs === "number" && now >= startMs) {
    return { label: "En curso", className: "bg-emerald-500/90 text-white" };
  }
  return { label: "Fecha pendiente", className: "bg-zinc-700/80 text-white" };
};

const getPriceLabel = (event: UserEvent): string => {
  if (event.isFree) return "Gratis";
  if (typeof event.priceAmount === "number") {
    return `${event.priceAmount.toLocaleString("es-CO")} ${event.priceCurrency ?? "COP"}`;
  }
  return "Sin precio";
};

export function PublicEventCard({ event }: PublicEventCardProps) {
  const timeState = getTimeState(event.startDate, event.endDate);
  const views = event.analytics?.views ?? 0;
  const likes = event.analytics?.likes ?? 0;
  const clicks = event.analytics?.clicks ?? 0;
  const isFree = event.isFree;

  return (
    <MagicCard
      className={cn(
        "group flex flex-col overflow-hidden transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-xl",
      )}
      aria-label={`Evento: ${event.title}`}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {event.image ? (
          <Image
            src={event.image}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            Sin imagen
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent" />

        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm",
              timeState.className,
            )}
          >
            {timeState.label}
          </span>
        </div>

        <div className="absolute right-3 top-3">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm",
              isFree ? "bg-emerald-500/90 text-white" : "bg-background/90 text-foreground",
            )}
          >
            {getPriceLabel(event)}
          </span>
        </div>

        <div className="absolute bottom-3 left-3">
          <EventStatusBadge status={event.status} className="border-0 bg-background/90 backdrop-blur-sm" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">{event.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
        </div>

        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          {event.startDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 shrink-0" />
              <span>{formatDate(event.startDate)}</span>
            </div>
          )}
          {event.location?.venue && (
            <div className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">
                {event.location.venue}
                {event.location.city ? ` · ${event.location.city}` : ""}
              </span>
            </div>
          )}
        </div>

        <div className="mt-auto grid grid-cols-3 gap-2 pt-1">
          <div className="flex flex-col items-center gap-1 rounded-xl bg-linear-to-br from-sky-500/10 to-sky-500/5 py-2">
            <Eye className="size-3.5 text-sky-600 dark:text-sky-400" />
            <span className="text-xs font-semibold text-foreground">{formatCompactNumber(views)}</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl bg-linear-to-br from-rose-500/10 to-rose-500/5 py-2">
            <Heart className="size-3.5 text-rose-600 dark:text-rose-400" />
            <span className="text-xs font-semibold text-foreground">{formatCompactNumber(likes)}</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl bg-linear-to-br from-amber-500/10 to-amber-500/5 py-2">
            <Share2 className="size-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-foreground">{formatCompactNumber(clicks)}</span>
          </div>
        </div>

        <Link href={`/events/${event.id}`} className="mt-1">
          <ShimmerButton
            shimmerColor="#ffffff"
            background="black"
            className="h-8 w-full gap-1.5 text-xs font-medium"
          >
            Ver evento
            <ArrowRight className="size-3.5" />
          </ShimmerButton>
        </Link>
      </div>
    </MagicCard>
  );
}
