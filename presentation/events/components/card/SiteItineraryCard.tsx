import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Tag } from "lucide-react";
import type { EventViewModel } from "@/presentation/events/view-models/EventViewModel";
import { cn } from "@/app/lib/utils/cn";

/** Formatea una fecha ISO en la zona horaria de Colombia. */
function fmtBogo(iso: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", ...opts }).format(
    new Date(iso),
  );
}

/** YYYY-MM-DD en Bogotá para comparar si dos ISOs caen el mismo día local. */
function bogoDay(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date(iso));
}

function buildDateLine(event: EventViewModel): string {
  const isMultiDate = event.eventType === "multi-date";
  if (isMultiDate && event.startDate && event.endDate) {
    const same = bogoDay(event.startDate) === bogoDay(event.endDate);
    if (same) {
      return fmtBogo(event.startDate, { day: "numeric", month: "short" }) + " · Varias sesiones";
    }
    return (
      fmtBogo(event.startDate, { day: "numeric", month: "short" }) +
      " – " +
      fmtBogo(event.endDate, { day: "numeric", month: "short" })
    );
  }
  if (event.startDate) {
    return fmtBogo(event.startDate, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return "Fecha por confirmar";
}

interface SiteItineraryCardProps {
  event: EventViewModel;
}

export function SiteItineraryCard({ event }: SiteItineraryCardProps) {
  const isMultiDate = event.eventType === "multi-date";
  const isFree = event.price?.isFree ?? event.price?.amount === 0;
  const href = `/eventos/${event.slug || event.id}`;
  const dateLine = buildDateLine(event);

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {/* Imagen */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {event.mainImage?.url ? (
          <Image
            src={event.mainImage.url}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Calendar className="size-8 text-muted-foreground/30" />
          </div>
        )}

        {/* Badge multi-date */}
        {isMultiDate && (
          <span className="absolute left-2 top-2 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
            Varias fechas
          </span>
        )}

        {/* Badge precio */}
        <span
          className={cn(
            "absolute right-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-semibold",
            isFree ? "bg-emerald-500/90 text-white" : "bg-black/55 text-white",
          )}
        >
          {isFree
            ? "Gratis"
            : isMultiDate
              ? "Ver precio"
              : `$${(event.price?.amount ?? 0).toLocaleString("es-CO")}`}
        </span>
      </div>

      {/* Contenido */}
      <div className="space-y-1.5 p-4">
        {/* Fecha */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary" suppressHydrationWarning>
          <Calendar className="size-3.5 shrink-0" aria-hidden />
          <span>{dateLine}</span>
        </div>

        {/* Título */}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
          {event.title}
        </h3>

        {/* Ubicación (solo eventos estándar) */}
        {!isMultiDate && event.location?.venue && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{event.location.venue}</span>
          </div>
        )}

        {/* Categoría */}
        {event.categoryInfo?.title && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Tag className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{event.categoryInfo.title}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

interface SiteItineraryGridProps {
  events: EventViewModel[];
  emptyMessage?: string;
}

export function SiteItineraryGrid({ events, emptyMessage }: SiteItineraryGridProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-12 text-center">
        <Calendar className="size-8 text-muted-foreground/30" aria-hidden />
        <p className="text-sm text-muted-foreground">
          {emptyMessage ?? "Todavía no hay eventos en este lugar."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <SiteItineraryCard key={event.id} event={event} />
      ))}
    </div>
  );
}
