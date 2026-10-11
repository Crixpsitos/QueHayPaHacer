"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { cn } from "@/app/lib/utils/cn";
import { CardLikeButton } from "./CardLikeButton";
import { EventViewModel } from "../../view-models/EventViewModel";
import {
  dateParts,
  formatDateRange,
  formatDayMonth,
  formatPrice,
  formatTime,
  sameDay,
} from "../detail/format";

interface EventCardProps {
  event: EventViewModel;
  /** Personas inscritas (solo para el JSON-LD: SoldOut). */
  attendeeCount?: number;
  /** Si el usuario actual ya dio like */
  initialLiked?: boolean;
  /** Callback al dar like; `false` revierte el estado optimista. */
  onLike?: (eventId: string, liked: boolean) => boolean | Promise<boolean>;
  className?: string;
  /** Imagen eager (LCP / above the fold) */
  prioritizeImage?: boolean;
}

/** Grid 1 → 2 → 3 → 4 columnas (ver EventCardInteractive). */
const CARD_SIZES = "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

/** "Sáb 10 oct, 19:00" · multi-date: "Del 10 de octubre al 3 de noviembre". */
export function dateLine(event: EventViewModel): string {
  const { startDate: start, endDate: end } = event;
  if (event.eventType === "multi-date") {
    if (!start || !end) return "Fechas por confirmar";
    return sameDay(start, end) ? `${formatDayMonth(start)}, varias funciones` : formatDateRange(start, end);
  }
  if (!start) return "Fecha por confirmar";
  const p = dateParts(start);
  const wd = p.weekdayShort.charAt(0).toUpperCase() + p.weekdayShort.slice(1);
  return `${wd} ${p.day} ${p.monthShort}, ${formatTime(start)}`;
}

/** Póster neutro cuando no hay imagen (o falla al cargar). */
export function PosterFallback({ title }: { title: string }) {
  return (
    <div className="absolute inset-0 flex items-end bg-[#09090B] p-4" aria-hidden="true">
      <span className="absolute inset-x-0 top-0 h-1 bg-[#E63946]" />
      <span className="font-heading text-6xl font-bold leading-none text-white/90">
        {title.trim().charAt(0).toUpperCase() || "?"}
      </span>
    </div>
  );
}

export const EventCard = ({
  event,
  attendeeCount = 0,
  initialLiked,
  onLike,
  className,
  prioritizeImage = false,
}: EventCardProps) => {
  const [liked, setLiked] = useState(initialLiked ?? false);
  const [imageFailed, setImageFailed] = useState(false);

  // Sincroniza cuando EventCardInteractive resuelve el fetch de likes (ajuste en render, sin effect).
  const [prevInitialLiked, setPrevInitialLiked] = useState(initialLiked);
  if (initialLiked !== prevInitialLiked) {
    setPrevInitialLiked(initialLiked);
    setLiked(initialLiked ?? false);
  }

  const handleLike = useCallback(async () => {
    const next = !liked;
    setLiked(next);
    const accepted = await onLike?.(event.id, next);
    if (accepted === false) setLiked(!next);
  }, [liked, event.id, onLike]);

  const isFree = event.price?.isFree ?? event.price?.amount === 0;
  const detailUrl = `/eventos/${event.slug || event.id}`;
  // Multi-date: la ubicación y el precio viven en las sesiones, no en el evento.
  const isMultiDate = event.eventType === "multi-date";
  const hasLocation = !isMultiDate && !!event.location;
  const imageUrl = !imageFailed ? event.mainImage?.url : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.shortDescription,
    ...(event.startDate ? { startDate: event.startDate } : {}),
    ...(event.endDate ? { endDate: event.endDate } : {}),
    eventStatus:
      event.status === "published"
        ? "https://schema.org/EventScheduled"
        : event.status === "cancelled"
          ? "https://schema.org/EventCancelled"
          : "https://schema.org/EventPostponed",
    ...(hasLocation
      ? {
          location: {
            "@type": "Place",
            name: event.location.venue,
            address: {
              "@type": "PostalAddress",
              streetAddress: event.location.address,
              addressLocality: event.location.city.name,
              addressRegion: event.location.department.name,
              addressCountry: event.location.country.name,
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: event.location.coordinates.lat,
              longitude: event.location.coordinates.lng,
            },
          },
        }
      : {}),
    organizer: {
      "@type": "Person",
      name: event.author.displayName,
    },
    image: event.mainImage?.url,
    ...(isMultiDate
      ? {}
      : {
          offers: {
            "@type": "Offer",
            price: isFree ? "0" : event.price.amount.toString(),
            priceCurrency: event.price.currency ?? "COP",
            availability:
              attendeeCount > 0 && event.capacity && attendeeCount >= event.capacity
                ? "https://schema.org/SoldOut"
                : "https://schema.org/InStock",
            url: detailUrl,
          },
        }),
    keywords: event.categoryInfo.tags.join(", "),
    about: { "@type": "Thing", name: event.categoryInfo.title },
  };

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white transition-shadow motion-reduce:transition-none hover:shadow-card",
        "focus-within:ring-2 focus-within:ring-[#E63946]/40 focus-within:ring-offset-2",
        className,
      )}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="relative aspect-4/3 w-full overflow-hidden bg-[#F4F4F5]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes={CARD_SIZES}
            className="object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.03] group-focus-within:scale-[1.03] motion-reduce:group-hover:scale-100 motion-reduce:group-focus-within:scale-100"
            loading={prioritizeImage ? "eager" : "lazy"}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <PosterFallback title={event.title} />
        )}
        {isMultiDate && (
          <span className="absolute bottom-3 left-3 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#09090B] ring-1 ring-black/5">
            Varias fechas
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        {event.categoryInfo?.title && (
          <p className="text-xs font-semibold text-[#E63946]">{event.categoryInfo.title}</p>
        )}
        <h3 className="font-heading line-clamp-2 text-base font-semibold leading-snug text-[#09090B] decoration-[#E63946] decoration-2 underline-offset-4 group-hover:underline group-has-[a:focus-visible]:underline">
          {/* Enlace estirado: toda la tarjeta es clickeable; el like queda encima (z-10). */}
          <Link href={detailUrl} className="after:absolute after:inset-0 focus-visible:outline-none">
            {event.title}
          </Link>
        </h3>
        <p className="text-sm tabular-nums text-[#3F3F46]" suppressHydrationWarning>
          {dateLine(event)}
        </p>
        {hasLocation && event.location.venue && (
          <p className="truncate text-sm text-[#71717A]">{event.location.venue}</p>
        )}
        {!isMultiDate && event.price && (
          <p className="mt-auto pt-2 text-sm font-semibold tabular-nums text-[#09090B]">
            {formatPrice(event.price)}
          </p>
        )}
      </div>

      <CardLikeButton liked={liked} onToggle={handleLike} />
    </article>
  );
};
