"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";
import Image from "next/image";
import { cn } from "@/app/lib/utils/cn";
import { buildProfileHref } from "@/presentation/profile/lib/profileHref";
import {
  ArrowRight,
  Calendar,
  Eye,
  Heart,
  MapPin,
  Share2,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { EventViewModel } from "../../view-models/EventViewModel";

interface EventCardProps {
  event: EventViewModel;
  /** Número de personas que han confirmado asistencia */
  attendeeCount?: number;
  /** Número inicial de likes (puede venir de la API) */
  initialLikes?: number;
  /** Si el usuario actual ya dio like */
  initialLiked?: boolean;
  /** Layout de la tarjeta */
  variant?: "vertical" | "horizontal";
  /** Callback al dar like (puede hacer mutación a la API) */
  onLike?: (eventId: string, liked: boolean) => boolean | Promise<boolean>;
  /** Callback al compartir */
  onShare?: (event: EventViewModel) => void;
  /** Callback al hacer click en "Ver detalles" (p. ej. registrar una vista) */
  onViewDetails?: (event: EventViewModel) => void;
  /** Clase extra para el contenedor raíz */
  className?: string;
  /** Indica si la imagen principal debe cargarse eager (LCP / above the fold) */
  prioritizeImage?: boolean;
  /** Número de vistas del evento */
  viewCount?: number;
  /** Indica si es el primer evento del autor */
  isFirstEvent?: boolean;
  /** Oculta la fila del autor (ej. en itinerarios donde el contexto ya lo implica) */
  hideAuthor?: boolean;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/** YYYY-MM-DD en zona Bogota — para comparar si dos ISO caen en el mismo día local. */
function toBogoDay(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date(iso));
}

/** Fecha compacta: "sáb, 9 ago · 8:00 p. m." */
function formatDateCompact(iso: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Rango de fechas para multi-date: "Del 11 al 15 de ago" */
function formatDateRange(startIso: string, endIso: string): string {
  const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", ...opts }).format(new Date(iso));
  const sameDay = toBogoDay(startIso) === toBogoDay(endIso);
  const startDay = fmt(startIso, { day: "numeric" });
  const endDay = fmt(endIso, { day: "numeric" });
  const endMonth = fmt(endIso, { month: "short" });
  const startMonth = fmt(startIso, { month: "short" });
  if (sameDay) return `El ${startDay} de ${endMonth}`;
  if (startMonth === endMonth) return `Del ${startDay} al ${endDay} de ${endMonth}`;
  return `Del ${startDay} de ${startMonth} al ${endDay} de ${endMonth}`;
}


function getAuthorInitials(displayName: string): string {
  return displayName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

/**
 * Pastilla de fecha — mismo lenguaje visual que `PublicSessionCard` del detalle,
 * pero con tokens semánticos para que invierta bien en modo oscuro.
 */
function DatePill({ iso, label }: { iso: string; label: string }) {
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", ...opts }).format(new Date(iso));
  return (
    <div
      className="flex w-13 shrink-0 flex-col items-center rounded-xl bg-primary py-1.5 text-white"
      suppressHydrationWarning
    >
      <span className="text-[9px] font-medium uppercase leading-none opacity-70">
        {label}
      </span>
      <span className="text-lg font-bold leading-tight">
        {fmt({ day: "numeric" })}
      </span>
      <span className="text-[9px] font-medium uppercase leading-none opacity-70">
        {fmt({ month: "short" })}
      </span>
    </div>
  );
}

export const EventCard = ({
  event,
  attendeeCount = 0,
  initialLikes,
  initialLiked,
  variant = "vertical",
  onLike,
  onShare,
  onViewDetails,
  className,
  prioritizeImage = false,
  viewCount = 0,
  isFirstEvent = false,  hideAuthor = false,}: EventCardProps) => {
  const [shared, setShared] = useState(false);
  const [liked, setLiked] = useState(initialLiked ?? false);
  const [likesCount, setLikesCount] = useState(initialLikes ?? event.analytics?.likes ?? 0);

  const handleLike = useCallback(async () => {
    const next = !liked;
    setLiked(next);
    setLikesCount((n) => n + (next ? 1 : -1));
    const accepted = await onLike?.(event.id, next);
    if (accepted === false) {
      setLiked(!next);
      setLikesCount((n) => n + (next ? -1 : 1));
    }
  }, [liked, event.id, onLike]);


  const handleShare = useCallback(async () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/eventos/${event.slug || event.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, url });
      } catch {
        // Si el usuario cancela el share, no hacemos nada
      }
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
    onShare?.(event);
  }, [event, onShare]);

  const isFree = event.price?.isFree ?? event.price?.amount === 0;
  const detailUrl = `/eventos/${event.slug || event.id}`;
  // Multi-date: la ubicación, fechas y precio viven en las sesiones, no en el evento.
  const isMultiDate = event.eventType === "multi-date";
  const hasLocation = !isMultiDate && !!event.location;
  // El rango sale de las sesiones (primera startDate → última endDate), sincronizado
  // al guardar/publicar. Un multi-date sin sesiones todavía no tiene rango.
  const hasRange = isMultiDate && !!event.startDate && !!event.endDate;
  const isSingleDay = hasRange && toBogoDay(event.startDate) === toBogoDay(event.endDate);

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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div
        className={cn(
          "group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-card transition-all duration-300 h-full hover:-translate-y-1 hover:shadow-hover",
          "focus-within:ring-2 focus-within:ring-primary/30 focus-within:ring-offset-2",
          className,
        )}
        aria-label={`Evento: ${event.title}`}
      >
        {/* ── 1. CABECERA — imagen 16:9 ── */}
        {/* Wrapper relative para el like button flotante */}
        <div className="relative">
        <Link
          href={detailUrl}
          onClick={() => onViewDetails?.(event)}
          className="relative block w-full overflow-hidden rounded-t-2xl"
        >
          <div className="relative aspect-video">
            {event.mainImage?.url ? (
              <>
                <Image
                  src={event.mainImage.url}
                  alt={event.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  loading={prioritizeImage ? "eager" : "lazy"}
                  priority={prioritizeImage}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <Calendar className="size-10 text-muted-foreground/20" />
              </div>
            )}

            {/* Badges top-left: categoría (Brand badge) + varias fechas */}
            <div className="absolute left-3 top-3 flex flex-col gap-1.5">
              {/* Badge Marca/Categoría — bg-surface blanco, texto primary-vibrant */}
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#E63946] shadow-sm">
                {event.categoryInfo.title}
              </span>
              {isMultiDate && (
                <span className="rounded-full bg-[#09090B]/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                  Varias fechas
                </span>
              )}
              {event.promotion?.isPromoted && (
                <span className="flex items-center gap-1 rounded-full bg-[#FFF8E7] px-2.5 py-1 text-[11px] font-semibold text-[#E09F00] shadow-sm">
                  <Sparkles className="size-3" />Destacado
                </span>
              )}
              {isFirstEvent && (
                <span className="rounded-full bg-[#FFF8E7] px-2.5 py-1 text-[11px] font-semibold text-[#E09F00] shadow-sm">
                  ✨ Primer evento
                </span>
              )}
            </div>

            {/* Vistas top-right — movidas al body */}
          </div>
        </Link>

        {/* Like button — flotante Airbnb, top-right sobre la imagen, min 44px */}
        <button
          type="button"
          onClick={handleLike}
          aria-label={liked ? "Quitar me gusta" : "Me gusta"}
          aria-pressed={liked}
          className={cn(
            "absolute right-2 top-2 z-10 flex size-11 items-center justify-center rounded-full shadow-dark-float transition-all",
            liked ? "bg-white" : "bg-white/80 hover:bg-white",
          )}
        >
          <Heart
            className={cn(
              "size-5 transition-all",
              liked ? "fill-[#E63946] text-[#E63946] scale-110" : "text-[#09090B]",
            )}
            aria-hidden="true"
          />
        </button>
        </div>

        {/* ── 2. CUERPO ── */}
        <div className="flex flex-1 flex-col gap-2 px-4 pt-3 pb-0">
          {/* Fila 1: Autor + Precio */}
          {!hideAuthor && (
            <div className="flex items-center justify-between gap-2">
              <Link
                href={buildProfileHref(event.author)}
                className="flex min-w-0 items-center gap-1.5 py-1 hover:opacity-80"
                aria-label={`Ver perfil de ${event.author.displayName}`}
              >
                <Avatar className="size-6 shrink-0">
                  <AvatarImage src={event.author.photoURL} alt={event.author.displayName} />
                  <AvatarFallback className="text-[9px] font-bold">
                    {getAuthorInitials(event.author.displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-[13px] text-[#71717A]">
                  Por <span className="font-medium text-[#09090B]">{event.author.displayName}</span>
                </span>
              </Link>
              {!isMultiDate ? (
                <span
                  className={cn(
                    "shrink-0 text-sm font-bold",
                    isFree ? "text-emerald-600" : "text-[#09090B]",
                  )}
                >
                  {isFree
                    ? "Gratis"
                    : `$${event.price.amount.toLocaleString("es-CO")} ${event.price.currency}`}
                </span>
              ) : (
                <span className="shrink-0 text-[11px] text-[#71717A] italic">Precios variados</span>
              )}
            </div>
          )}

          {/* Fila 2: T\u00edtulo */}
          <h2 className="text-base font-bold leading-snug text-[#09090B] line-clamp-2">
            {event.title}
          </h2>

          {/* Fila 3: Descripci\u00f3n corta, 1 l\u00ednea (sin chips de tags) */}
          <p className="text-[13px] text-[#71717A] line-clamp-1">{event.shortDescription}</p>

          {/* Indicadores extra: vistas, inscripciones y apertura */}
          {viewCount > 0 && (
            <div className="flex items-center gap-1.5 text-[13px] text-[#71717A]">
              <Eye className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{viewCount.toLocaleString("es-CO")} vistas</span>
            </div>
          )}
          {attendeeCount > 0 && (event.registrationType === "internal" || event.registrationType === "form") && (
            <div className="flex items-center gap-1.5 text-[13px] text-[#71717A]">
              <Users className="size-3.5 shrink-0 text-[#E63946]" aria-hidden="true" />
              <span>{attendeeCount.toLocaleString("es-CO")} inscritos</span>
            </div>
          )}
          {event.registrationType === "none" && (
            <span className="flex w-fit items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              🎉 Abierto al público
            </span>
          )}
          {isMultiDate ? (
            <div className="space-y-1.5">
              <div
                className="flex items-center justify-between gap-2 rounded-lg bg-[#F4F4F5] px-3 py-2"
                suppressHydrationWarning
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Calendar className="size-3.5 shrink-0 text-[#09090B]" />
                  <span className="truncate text-[13px] font-semibold text-[#09090B]">
                    {hasRange
                      ? formatDateRange(event.startDate, event.endDate)
                      : "Fechas por confirmar"}
                  </span>
                </div>
                {hasRange && (
                  <span className="shrink-0 rounded-full border border-border bg-white px-2 py-0.5 text-[11px] font-semibold text-[#71717A]">
                    {isSingleDay ? "Varias sesiones" : "Varios horarios"}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5" suppressHydrationWarning>
              {event.startDate && (
                <div className="flex items-center gap-1.5 text-[13px] text-[#71717A]">
                  <Calendar className="size-3.5 shrink-0" />
                  <span suppressHydrationWarning>{formatDateCompact(event.startDate)}</span>
                </div>
              )}
              {hasLocation && event.location?.venue && (
                <div className="flex items-center gap-1.5 text-[13px] text-[#71717A]">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">{event.location.venue}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 3. FOOTER ── */}
        <div className="mt-auto flex items-center gap-2 border-t border-[#F4F4F5] px-4 py-3">
          {/* Compartir — min 44px touch target */}
          <button
            type="button"
            onClick={handleShare}
            aria-label={shared ? "¡Enlace copiado!" : "Compartir evento"}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl text-[13px] text-[#71717A] transition-colors hover:bg-muted hover:text-[#09090B]"
          >
            <Share2 className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{shared ? "\u00a1Copiado!" : "Compartir"}</span>
          </button>

          {/* CTA — min 44px height para mobile */}
          <Link
            href={detailUrl}
            onClick={() => onViewDetails?.(event)}
            className="ml-auto flex min-h-[44px] items-center gap-1.5 rounded-full bg-[#09090B] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#18181B]"
            aria-label={isMultiDate ? "Ver fechas del evento" : "Ver detalles del evento"}
          >
            {isMultiDate ? "Ver fechas" : "Ver detalles"}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </>
  );
};
