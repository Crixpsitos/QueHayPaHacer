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
import { ResponsivePicture } from "@/app/components/ui/ResponsivePicture";
import { Separator } from "@/app/components/ui/separator";
import { ShimmerButton } from "@/app/components/ui/shimmer-button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { cn } from "@/app/lib/utils/cn";
import {
  ArrowRight,
  Calendar,
  ExternalLink,
  Heart,
  MapPin,
  Share2,
  Sparkles,
  Tag,
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
  /** Clase extra para el contenedor raíz */
  className?: string;
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

export const EventCard = ({
  event,
  attendeeCount = 0,
  initialLikes,
  initialLiked,
  variant = "vertical",
  onLike,
  onShare,
  className,
}: EventCardProps) => {
  const [liked, setLiked] = useState(initialLiked ?? false);
  const [likes, setLikes] = useState(initialLikes ?? 0);
  const [shared, setShared] = useState(false);

  const handleLike = useCallback(async () => {
    const next = !liked;
    setLiked(next);
    setLikes((l) => (next ? l + 1 : l - 1));
    const accepted = await onLike?.(event.id, next);

    if (accepted === false) {
      setLiked(!next);
      setLikes((l) => (next ? l - 1 : l + 1));
    }
  }, [liked, event.id, onLike]);

  const handleShare = useCallback(async () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/eventos/${event.slug}`;
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

  const isFree = event.price.isFree ?? event.price.amount === 0;
  const detailUrl = `/events/${event.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.shortDescription,
    startDate: event.startDate,
    endDate: event.endDate,
    eventStatus:
      event.status === "published"
        ? "https://schema.org/EventScheduled"
        : event.status === "cancelled"
          ? "https://schema.org/EventCancelled"
          : "https://schema.org/EventPostponed",
    location: {
      "@type": "Place",
      name: event.location.venue,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.location.address,
        addressLocality: event.location.city,
        addressRegion: event.location.department,
        addressCountry: event.location.country,
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: event.location.coordinates.lat,
        longitude: event.location.coordinates.lng,
      },
    },
    organizer: {
      "@type": "Person",
      name: event.author.displayName,
    },
    image: event.images?.desktop.url,
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
          "group overflow-hidden transition-all duration-300",
          "hover:shadow-lg hover:-translate-y-0.5",
          "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
          variant === "horizontal"
            ? "flex flex-row max-w-lg"
            : "flex flex-col max-w-sm w-full",
          className,
        )}
        aria-label={`Evento: ${event.title}`}
      >
        {/* ── Imagen ── */}
        <div className={cn("relative shrink-0 overflow-hidden")}>
          <ResponsivePicture
            desktop={event.images.desktop}
            tablet={event.images.tablet}
            mobile={event.images.mobile}
            loading="eager"
          />

          {/* Overlay para legibilidad de badges */}
          <div
            className="absolute inset-0 bg-linear-to-b from-black/20 to-transparent pointer-events-none"
            aria-hidden="true"
          />

          {/* Badges top-left: categoría + destacado */}
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

            {event.promotion.isPromoted && (
              <Badge
                className="text-[10px] py-0.5 px-2 font-medium bg-amber-500/90 text-amber-950 backdrop-blur-sm border-0"
                aria-label="Evento destacado / promocionado"
              >
                <Sparkles className="size-3 mr-1" aria-hidden="true" />
                Destacado
              </Badge>
            )}
          </div>

          {/* Badge top-right: asistentes */}
          {attendeeCount > 0 && (
            <div
              className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-background/90 backdrop-blur-sm px-2 py-1 text-xs font-medium shadow-sm"
              aria-label={`${attendeeCount.toLocaleString("es-CO")} personas asistirán a este evento`}
            >
              <Users className="size-3" aria-hidden="true" />
              <span>{attendeeCount.toLocaleString("es-CO")}</span>
            </div>
          )}
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

                {/* Precio inline solo en variante vertical */}
                {variant === "vertical" && (
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

              {/* Precio debajo del nombre solo en variante horizontal */}
              {variant === "horizontal" && (
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
            <h2 className="text-lg font-semibold leading-snug text-foreground line-clamp-2">
              {event.title}
            </h2>
          </CardHeader>

          <CardContent
            className={cn(
              "pb-2 flex-1 space-y-3",
              variant === "horizontal" ? "px-5" : "px-4",
            )}
          >
            {/* Descripción corta */}
            <p className="text-sm text-foreground/70 leading-relaxed line-clamp-3">
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

            {/* Fecha + Ubicación — grid en horizontal, columna en vertical */}
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
                aria-label={`Ubicación: ${event.location.venue}, ${event.location.address}, ${event.location.city}, ${event.location.department}, ${event.location.country}`}
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
                    {event.location.city}, {event.location.department} ·{" "}
                    {event.location.country}
                  </div>
                </div>
              </address>
            </div>

            {/* Barra de capacidad */}
            {event.capacity !== undefined && attendeeCount > 0 && (
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

          <CardFooter className="px-4 pt-0 pb-3 flex flex-col gap-2">
            <Separator className="mb-1" />

            <div className="flex items-center gap-1.5 w-full">
              {/* Botón Like */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-2.5 gap-1.5 text-xs font-normal transition-colors",
                      liked
                        ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={handleLike}
                    aria-label={`${liked ? "Quitar like" : "Dar like"} — ${likes.toLocaleString("es-CO")} likes`}
                    aria-pressed={liked}
                  >
                    <Heart
                      className={cn("size-4", liked && "fill-current")}
                      aria-hidden="true"
                    />
                    <span>{likes.toLocaleString("es-CO")}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {liked ? "Quitar me gusta" : "Me gusta"}
                </TooltipContent>
              </Tooltip>

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

              {/* CTA — Ver detalles */}
              {event.registrationType === "external" && event.externalUrl ? (
                <a
                  href={event.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto"
                  aria-label={`Ver detalles del evento: ${event.title}`}
                >
                  <ShimmerButton
                    shimmerColor="#ffffff"
                    background="black"
                    className="h-8 px-3 gap-1.5 text-xs font-medium"
                  >
                    Ver detalles
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </ShimmerButton>
                </a>
              ) : (
                <Link
                  href={detailUrl}
                  className="ml-auto"
                  aria-label={`Ver detalles del evento: ${event.title}`}
                >
                  <ShimmerButton
                    shimmerColor="#ffffff"
                    background="black"
                    className="h-8 px-3 gap-1.5 text-xs font-medium"
                  >
                    Ver detalles
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </ShimmerButton>
                </Link>
              )}
            </div>
          </CardFooter>
        </div>
      </MagicCard>
    </>
  );
};
