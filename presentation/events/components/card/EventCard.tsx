"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState, useSyncExternalStore } from "react";
import { Clock, Heart, MapPin, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { cn } from "@/app/lib/utils/cn";
import { CardLikeButton } from "./CardLikeButton";
import { compactCount, registrationLabel, spotsInfo, timingBadge } from "./cardMeta";
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

const noopSubscribe = () => () => {};

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
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);

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

  const timing = isClient ? timingBadge(event.startDate, event.endDate, new Date(), isMultiDate) : null;
  const spots = spotsInfo(event.capacity, event.analytics?.registrations ?? attendeeCount);
  const registered = event.analytics?.registrations ?? attendeeCount;
  const likes = event.analytics?.likes ?? 0;
  const stub = event.startDate ? dateParts(event.startDate) : null;
  const authorName = event.author?.displayName?.trim() || "Organizador";
  const place = hasLocation ? [event.location.venue, event.location.city?.name].filter(Boolean).join(", ") : "";

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
        {/* Degradado inferior: da contraste a las etiquetas sobre cualquier foto. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/45 to-transparent" />

        {/* Talón de la boleta: fecha de un vistazo. */}
        {stub && (
          <div className="absolute left-3 top-3 w-12 overflow-hidden rounded-xl bg-[#09090B] text-center text-white shadow-sm ring-1 ring-white/15">
            <span className="block pt-1.5 text-[11px] font-medium leading-none text-white/70">{stub.weekdayShort}</span>
            <span className="block font-heading text-xl font-bold leading-tight tabular-nums">{stub.day}</span>
            <span className="block bg-[#E63946] py-0.5 text-[11px] font-semibold leading-none">{stub.monthShort}</span>
          </div>
        )}

        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {timing && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-black/5",
                  timing.tone === "live" ? "bg-[#E63946] text-white" : "bg-white text-[#09090B]",
                )}
              >
                {timing.tone === "live" && <span className="size-1.5 rounded-full bg-white" aria-hidden="true" />}
                {timing.label}
              </span>
            )}
            {isMultiDate && (
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#09090B] ring-1 ring-black/5">
                Varias fechas
              </span>
            )}
          </div>
          {!isMultiDate && event.price && (
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ring-1 ring-black/5",
                isFree ? "bg-[#FFB703] text-[#09090B]" : "bg-white text-[#09090B]",
              )}
            >
              {formatPrice(event.price)}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2 text-xs">
          {event.categoryInfo?.title ? (
            <span className="truncate font-semibold text-[#E63946]">{event.categoryInfo.title}</span>
          ) : (
            <span />
          )}
          <span className="shrink-0 text-[#71717A]">{registrationLabel(event.registrationType)}</span>
        </div>

        <h3 className="font-heading line-clamp-2 text-lg font-semibold leading-snug text-[#09090B] decoration-[#E63946] decoration-2 underline-offset-4 group-hover:underline group-has-[a:focus-visible]:underline">
          {/* Enlace estirado: toda la tarjeta es clickeable; el like queda encima (z-10). */}
          <Link href={detailUrl} className="after:absolute after:inset-0 focus-visible:outline-none">
            {event.title}
          </Link>
        </h3>

        {event.shortDescription && (
          <p className="line-clamp-2 text-sm leading-relaxed text-[#52525B]">{event.shortDescription}</p>
        )}

        <ul className="mt-1 space-y-1.5 text-sm text-[#3F3F46]">
          <li className="flex items-start gap-2">
            <Clock className="mt-0.5 size-4 shrink-0 text-[#A1A1AA]" aria-hidden="true" />
            <span className="tabular-nums" suppressHydrationWarning>
              {dateLine(event)}
            </span>
          </li>
          {place && (
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-[#A1A1AA]" aria-hidden="true" />
              <span className="line-clamp-1">{place}</span>
            </li>
          )}
        </ul>

        {/* Perforación de la boleta + pie: quién organiza y cómo va el evento. */}
        <div className="relative mt-auto border-t border-dashed border-[#E4E4E7] pt-3">
          <span aria-hidden="true" className="absolute -left-6 -top-2 size-4 rounded-full border border-[#E4E4E7] bg-[#FAFAFC]" />
          <span aria-hidden="true" className="absolute -right-6 -top-2 size-4 rounded-full border border-[#E4E4E7] bg-[#FAFAFC]" />
          <div className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <Avatar className="size-6">
                {event.author?.photoURL && <AvatarImage src={event.author.photoURL} alt="" />}
                <AvatarFallback className="text-[10px]">{authorName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="truncate text-xs text-[#52525B]">{authorName}</span>
            </span>
            <span className="flex shrink-0 items-center gap-3 text-xs tabular-nums text-[#52525B]">
              {spots ? (
                <span
                  className={cn(
                    "font-medium",
                    spots.tone === "low" && "text-[#B45309]",
                    spots.tone === "full" && "text-[#E63946]",
                  )}
                >
                  {spots.label}
                </span>
              ) : (
                registered > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5" aria-hidden="true" />
                    <span className="sr-only">Inscritos:</span>
                    {compactCount(registered)}
                  </span>
                )
              )}
              {likes > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Heart className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">Me gusta:</span>
                  {compactCount(likes)}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      <CardLikeButton liked={liked} onToggle={handleLike} />
    </article>
  );
};
