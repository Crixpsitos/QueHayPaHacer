"use client";

import { AnimatedGradientText } from "@/app/components/ui/animated-gradient-text";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button/button";
import { CardContent, CardFooter, CardHeader } from "@/app/components/ui/card";
import { MagicCard } from "@/app/components/ui/magic-card";
import Image from "next/image";
import { Separator } from "@/app/components/ui/separator";
import { ShimmerButton } from "@/app/components/ui/shimmer-button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { cn } from "@/app/lib/utils/cn";
import { buildProfileHref } from "@/presentation/profile/lib/profileHref";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowRight,
  Calendar,
  Eye,
  MapPin,
  Share2,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { EventViewModel } from "../../view-models/EventViewModel";
import { HeartLikeButton } from "./HeartLikeButton";

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
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
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
  const date = new Date(iso);
  return (
    <div
      className="flex w-13 shrink-0 flex-col items-center rounded-lg bg-foreground py-1.5 text-background"
      suppressHydrationWarning
    >
      <span className="text-[9px] font-medium uppercase leading-none opacity-70">
        {label}
      </span>
      <span className="text-lg font-bold leading-tight">
        {format(date, "d", { locale: es })}
      </span>
      <span className="text-[9px] font-medium uppercase leading-none opacity-70">
        {format(date, "MMM", { locale: es })}
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
  isFirstEvent = false,
}: EventCardProps) => {
  const [shared, setShared] = useState(false);


  const handleShare = useCallback(async () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/events/${event.slug || event.id}`;
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
  const detailUrl = `/events/${event.slug || event.id}`;
  // Multi-date: la ubicación, fechas y precio viven en las sesiones, no en el evento.
  const isMultiDate = event.eventType === "multi-date";
  const hasLocation = !isMultiDate && !!event.location;
  // El rango sale de las sesiones (primera startDate → última endDate), sincronizado
  // al guardar/publicar. Un multi-date sin sesiones todavía no tiene rango.
  const hasRange = isMultiDate && !!event.startDate && !!event.endDate;
  const isSingleDay =
    hasRange &&
    new Date(event.startDate).toDateString() ===
      new Date(event.endDate).toDateString();

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

      <MagicCard
        className={cn(
          "group overflow-hidden transition-all duration-300 h-full",
          "hover:shadow-lg hover:-translate-y-0.5",
          "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
          variant === "horizontal"
            ? "flex flex-row max-w-lg"
            : "flex flex-col w-full",
          className,
        )}
        aria-label={`Evento: ${event.title}`}
      >
        {/* ── Imagen ── */}
        <div className={cn("relative shrink-0 overflow-hidden")}>
          <div className="relative aspect-square w-full">
            <Image
              src={event.mainImage?.url ?? ""}
              alt={`Imagen principal de ${event.title}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading={prioritizeImage ? "eager" : "lazy"}
              fetchPriority={prioritizeImage ? "high" : "auto"}
              priority={prioritizeImage}
            />
          </div>

          {/* Overlay para legibilidad de badges */}
          <div
            className="absolute inset-0 bg-linear-to-b from-black/20 to-transparent pointer-events-none"
            aria-hidden="true"
          />

          {/* Badges top-left: categoría + destacado + primer evento */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
            <div
              className="inline-flex items-center gap-1 rounded-full bg-background/90 backdrop-blur-sm px-2 py-0.5"
              aria-label={`Categoría: ${event.categoryInfo.title}`}
            >
              <Tag
                className="size-3 text-muted-foreground"
                aria-hidden="true"
              />
              <AnimatedGradientText className="text-[10px] font-medium">
                {event.categoryInfo.title}
              </AnimatedGradientText>
            </div>

            {isMultiDate && (
              <Badge
                className="text-[10px] py-0.5 px-2 font-medium bg-violet-500/90 text-white backdrop-blur-sm border-0"
                aria-label="Evento con varias fechas"
              >
                <Calendar className="size-3 mr-1" aria-hidden="true" />
                Varias fechas
              </Badge>
            )}

            {event.promotion.isPromoted && (
              <Badge
                className="text-[10px] py-0.5 px-2 font-medium bg-amber-500/90 text-amber-950 backdrop-blur-sm border-0"
                aria-label="Evento destacado / promocionado"
              >
                <Sparkles className="size-3 mr-1" aria-hidden="true" />
                Destacado
              </Badge>
            )}

            {isFirstEvent && (
              <Badge
                className="text-[10px] py-0.5 px-2 font-medium bg-yellow-500/90 text-yellow-950 backdrop-blur-sm border-2 border-yellow-400"
                aria-label="Primer evento del autor"
              >
                <Sparkles className="size-3 mr-1" aria-hidden="true" />
                Primer Evento
              </Badge>
            )}
          </div>

          {/* Badge top-right: asistentes + vistas */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5">
            {attendeeCount > 0 && (
              <div
                className="flex items-center gap-1 rounded-md bg-background/90 backdrop-blur-sm px-2 py-1 text-xs font-medium shadow-sm"
                aria-label={`${attendeeCount.toLocaleString("es-CO")} personas asistirán a este evento`}
              >
                <Users className="size-3" aria-hidden="true" />
                <span>{attendeeCount.toLocaleString("es-CO")}</span>
              </div>
            )}
            {viewCount > 0 && (
              <div
                className="flex items-center gap-1 rounded-md bg-background/90 backdrop-blur-sm px-2 py-1 text-xs font-medium shadow-sm"
                aria-label={`${viewCount.toLocaleString("es-CO")} personas han visto este evento`}
              >
                <Eye className="size-3" aria-hidden="true" />
                <span>{viewCount.toLocaleString("es-CO")}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Cuerpo ── */}
        <div className="flex flex-col flex-1 min-w-0">
          <CardHeader className="pb-2 pt-3 px-4">
            {/* Autor + precio */}
            <div
              className={cn(
                "flex mb-2",
                variant === "horizontal"
                  ? "flex-col items-start gap-0.5" // autor arriba, precio abajo
                  : "flex-row items-center gap-2", // autor izquierda, precio derecha
              )}
            >
              <div className="flex items-center gap-2 w-full">
                <Link
                  href={buildProfileHref(event.author)}
                  className="flex min-w-0 flex-1 items-center gap-2 hover:underline"
                  aria-label={`Ver perfil de ${event.author.displayName}`}
                >
                  <Avatar className="size-6 shrink-0">
                    <AvatarImage
                      src={event.author.photoURL}
                      alt={`Foto de ${event.author.displayName}`}
                    />
                    <AvatarFallback className="text-[10px]">
                      {getAuthorInitials(event.author.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-foreground/70 truncate">
                    Por{" "}
                    <span className="font-medium text-foreground">
                      {event.author.displayName}
                    </span>
                  </span>
                </Link>

                {/* Precio inline solo en variante vertical (no multi-date: el precio vive en las sesiones) */}
                {variant === "vertical" && !isMultiDate && (
                  <span
                    className={cn(
                      "ml-auto text-xs font-semibold shrink-0",
                      isFree
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-foreground",
                    )}
                    aria-label={
                      isFree
                        ? "Evento gratuito"
                        : `Precio: ${event.price.amount.toLocaleString("es-CO")} ${event.price.currency}`
                    }
                  >
                    {isFree
                      ? "Gratis"
                      : `${event.price.amount.toLocaleString("es-CO")} ${event.price.currency}`}
                  </span>
                )}
              </div>

              {/* Precio debajo del nombre solo en variante horizontal (no multi-date) */}
              {variant === "horizontal" && !isMultiDate && (
                <span
                  className={cn(
                    "ml-8 text-xs font-semibold shrink-0",
                    isFree
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-foreground",
                  )}
                  aria-label={
                    isFree
                      ? "Evento gratuito"
                      : `Precio: ${event.price.amount.toLocaleString("es-CO")} ${event.price.currency}`
                  }
                >
                  {isFree
                    ? "Gratis"
                    : `${event.price.amount.toLocaleString("es-CO")} ${event.price.currency}`}
                </span>
              )}
            </div>

            {/* Título */}
            {/* break-words: sin esto un título sin espacios desborda la card. */}
            <h2 className="text-lg font-semibold leading-snug text-foreground line-clamp-2 break-words">
              {event.title}
            </h2>
          </CardHeader>

          <CardContent
            className={cn(
              "pb-2 space-y-3",
              variant === "horizontal" ? "px-5" : "px-4",
            )}
          >
            {/* Descripción corta */}
            <p className="text-sm text-foreground/70 leading-relaxed line-clamp-2 break-words">
              {event.shortDescription}
            </p>

            {/* Tags / etiquetas */}
            {event.categoryInfo.tags.length > 0 && (
              <div
                className="flex flex-wrap gap-1.5"
                role="list"
                aria-label="Etiquetas del evento"
              >
                {event.categoryInfo.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    role="listitem"
                    className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium text-foreground/70 hover:border-foreground/30 transition-colors cursor-default"
                  >
                    {tag}
                  </span>
                ))}
                {event.categoryInfo.tags.length > 4 && (
                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] text-foreground/60">
                    +{event.categoryInfo.tags.length - 4}
                  </span>
                )}
              </div>
            )}

            {/* Multi-date: sin lugar ni precio únicos (viven en cada sesión) —
                mostramos el rango que cubren las sesiones. */}
            {isMultiDate ? (
              hasRange ? (
                <div
                  className="flex items-center gap-2 rounded-xl border bg-muted/30 p-2"
                  aria-label={
                    isSingleDay
                      ? `Varias sesiones el ${formatDate(event.startDate)}`
                      : `Varias fechas, del ${formatDate(event.startDate)} al ${formatDate(event.endDate)}`
                  }
                  suppressHydrationWarning
                >
                  <DatePill
                    iso={event.startDate}
                    label={isSingleDay ? "El" : "Desde"}
                  />

                  {/* Mismo día → una pastilla y texto: "14 jul → 14 jul" parecería un bug.
                      No repetimos "varias fechas": ya es un badge sobre la imagen. */}
                  {isSingleDay ? (
                    <span className="min-w-0 flex-1 text-xs text-foreground/70">
                      Todas las sesiones este día
                    </span>
                  ) : (
                    <>
                      <div
                        className="flex min-w-0 flex-1 items-center gap-1"
                        aria-hidden="true"
                      >
                        <span className="h-px flex-1 bg-border" />
                        <ArrowRight className="size-3.5 shrink-0 text-foreground/40" />
                      </div>
                      <DatePill iso={event.endDate} label="Hasta" />
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-dashed p-2.5 text-xs text-foreground/60">
                  <Calendar className="size-4 shrink-0" aria-hidden="true" />
                  Fechas por confirmar
                </div>
              )
            ) : (
              /* Fecha + Ubicación — grid en horizontal, columna en vertical */
              <div
                className={cn(
                  "gap-3",
                  variant === "horizontal" ? "grid grid-cols-2" : "flex flex-col",
                )}
              >
                {/* Fecha */}
                <div
                  className="flex items-start gap-2 text-sm text-foreground/70"
                  aria-label={`Evento del ${formatDate(event.startDate)} al ${formatDate(event.endDate)}`}
                  suppressHydrationWarning
                >
                  <Calendar
                    className="size-4 mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <div className="leading-snug">
                    <div
                      className="font-medium text-foreground text-xs"
                      suppressHydrationWarning
                    >
                      {formatDate(event.startDate)}
                    </div>
                    <div className="text-xs" suppressHydrationWarning>
                      hasta {formatDate(event.endDate)}
                    </div>
                  </div>
                </div>

                {/* Ubicación */}
                <address
                  className="not-italic flex items-start gap-2 text-sm text-foreground/70"
                  aria-label={`Ubicación: ${event.location.venue}, ${event.location.address}, ${event.location.city.name}, ${event.location.department.name}, ${event.location.country.name}`}
                >
                  <MapPin
                    className="size-4 mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <div className="leading-snug min-w-0">
                    <div className="font-medium text-foreground text-xs truncate">
                      {event.location.venue}
                    </div>
                    <div className="text-xs truncate">
                      {event.location.address}
                    </div>
                    <div className="text-xs text-foreground/55 truncate">
                      {event.location.city.name}, {event.location.department.name} ·{" "}
                      {event.location.country.name}
                    </div>
                  </div>
                </address>
              </div>
            )}

            {/* Barra de capacidad */}
            {event.capacity !== undefined && event.capacity > 0 && attendeeCount > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-foreground/70">
                  <span
                    aria-label={`${attendeeCount} de ${event.capacity} lugares ocupados`}
                  >
                    <span className="font-medium text-foreground">
                      {attendeeCount.toLocaleString("es-CO")}
                    </span>{" "}
                    / {event.capacity.toLocaleString("es-CO")} asistentes
                  </span>
                  <span>
                    {Math.round((attendeeCount / event.capacity) * 100)}%
                  </span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full bg-muted overflow-hidden"
                  role="progressbar"
                  aria-valuenow={attendeeCount}
                  aria-valuemin={0}
                  aria-valuemax={event.capacity}
                  aria-label={`${Math.round((attendeeCount / event.capacity) * 100)}% de capacidad ocupada`}
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      attendeeCount / event.capacity > 0.9
                        ? "bg-destructive"
                        : attendeeCount / event.capacity > 0.7
                          ? "bg-amber-500"
                          : "bg-primary",
                    )}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((attendeeCount / event.capacity) * 100),
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="px-4 pt-0 pb-3 flex flex-col gap-2 mt-auto">
            <Separator className="mb-1" />

            <div className="flex items-center gap-1.5 w-full">
              {/* Botón Like */}
              <HeartLikeButton
                key={`${event.id}:${initialLiked ? "1" : "0"}:${initialLikes ?? 0}`}
                eventId={event.id}
                initialLiked={initialLiked}
                initialLikes={initialLikes}
                onLike={onLike}
              />

              {/* Botón Compartir */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 gap-1.5 text-xs font-normal text-muted-foreground hover:text-foreground"
                    onClick={handleShare}
                    aria-label={
                      shared ? "¡Enlace copiado!" : "Compartir evento"
                    }
                  >
                    <Share2 className="size-4" aria-hidden="true" />
                    <span className="hidden sm:inline">
                      {shared ? "¡Copiado!" : "Compartir"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {shared ? "¡Enlace copiado!" : "Compartir evento"}
                </TooltipContent>
              </Tooltip>

              {/* CTA — Ver detalles: siempre navega a la página interna del evento */}
              <Link
                href={detailUrl}
                className="ml-auto"
                aria-label={`Ver detalles del evento: ${event.title}`}
                onClick={() => onViewDetails?.(event)}
              >
                <ShimmerButton
                  shimmerColor="#ffffff"
                  background="black"
                  className="h-8 px-3 gap-1.5 text-xs font-medium"
                >
                  {isMultiDate ? "Ver fechas" : "Ver detalles"}
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </ShimmerButton>
              </Link>
            </div>
          </CardFooter>
        </div>
      </MagicCard>
    </>
  );
};
