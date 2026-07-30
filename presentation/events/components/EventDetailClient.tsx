"use client";

import { useState, useEffect, useRef, lazy, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarDays,
  MapPin,
  User,
  DollarSign,
  Users,
  ChevronDown,
  ChevronUp,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Clock,
  LayoutDashboard,
  Pencil,
} from "lucide-react";
import { renderToHTMLString } from "@tiptap/static-renderer";
import DOMPurify from "dompurify";
import StarterKit from "@tiptap/starter-kit";
import { Badge } from "@/app/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/app/components/ui/avatar";
import { Separator } from "@/app/components/ui/separator";
import { Section } from "@/app/components/layout/shared/Section";
import { SocialShareBar } from "@/presentation/shared/components/SocialShareBar";
import { shareEventAction } from "@/app/actions/events/share-event.action";
import { EventDetailActions } from "./EventDetailActions";
import { EventCollaboratorsDialog } from "./EventCollaboratorsDialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/app/components/ui/carousel";
import { cn } from "@/app/lib/utils/cn";
import { buildProfileHref } from "@/presentation/profile/lib/profileHref";
import type { EventViewModel } from "../view-models/EventViewModel";
import type { MediaItem, MediaImageItem, MediaVideoItem } from "@/domain/entities/events/value-objects/Media";
import { registerEventAction } from "@/app/actions/events/register-event.action";
import { recordExternalRegistrationClickAction } from "@/app/actions/studio/record-external-registration-click.action";
import { EventAttendeesDialog } from "./EventAttendeesDialog";

// Lazy — solo se carga si el usuario abre el modal
const EventRegistrationModal = lazy(() =>
  import("./EventRegistrationModal").then((m) => ({ default: m.EventRegistrationModal }))
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface MediaSlide {
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  alt?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const extensions = [StarterKit];

function formatDate(dateStr: string) {
  return format(new Date(dateStr), "d 'de' MMMM yyyy, HH:mm", { locale: es });
}

function formatPrice(price: EventViewModel["price"]) {
  if (price.isFree) return "Gratis";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: price.currency || "COP",
    maximumFractionDigits: 0,
  }).format(price.amount);
}

function isPortrait(item: MediaVideoItem): boolean {
  const { width, height } = item.data;
  if (!width || !height) return false;
  return height / width >= 1.5;
}

function buildSlides(
  mainImage: EventViewModel["mainImage"],
  media: MediaItem[],
): MediaSlide[] {
  const slides: MediaSlide[] = [];
  if (mainImage?.url) {
    slides.push({ type: "image", url: mainImage.url, alt: "Imagen principal" });
  }
  for (const item of media) {
    if (item.type === "image") {
      const img = item as MediaImageItem;
      slides.push({ type: "image", url: img.data.url, alt: img.data.alt });
    } else {
      const vid = item as MediaVideoItem;
      const url = vid.data.url || vid.data.temporaryUrl || "";
      if (url) {
        slides.push({
          type: "video",
          url,
          thumbnailUrl: vid.data.thumbnailUrl,
          width: vid.data.width,
          height: vid.data.height,
        });
      }
    }
  }
  return slides;
}

// ---------------------------------------------------------------------------
// Expandable description
// ---------------------------------------------------------------------------
function ExpandableDescription({ html }: { html: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    requestAnimationFrame(() => {
      if (el.scrollHeight > 240) setOverflows(true);
    });
  }, [html]);

  return (
    <div className="space-y-3">
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          expanded ? "max-h-[2000px]" : "max-h-60",
        )}
      >
        <div
          className="tiptap prose prose-sm max-w-none text-gray-700 focus:outline-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {!expanded && overflows && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>
      {overflows && (
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:opacity-70 transition-opacity"
        >
          {expanded ? (
            <>Leer menos <ChevronUp className="h-4 w-4" /></>
          ) : (
            <>Leer más <ChevronDown className="h-4 w-4" /></>
          )}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lightbox — powered by Embla Carousel (same lib as CampaignCarousel)
// ---------------------------------------------------------------------------
function Lightbox({
  slides,
  initial,
  onClose,
}: {
  slides: MediaSlide[];
  initial: number;
  onClose: () => void;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [idx, setIdx] = useState(initial);

  // Sync Embla index → state for dots
  useEffect(() => {
    if (!api) return;
    api.scrollTo(initial, true); // jump without animation on open
    const onSelect = () => setIdx(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => { api.off("select", onSelect); };
  }, [api, initial]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") api?.scrollPrev();
      if (e.key === "ArrowRight") api?.scrollNext();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [api, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/35 transition-colors backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Prev / Next */}
      {slides.length > 1 && (
        <>
          <button
            className="absolute left-2 sm:left-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/35 transition-colors backdrop-blur-sm"
            onClick={(e) => { e.stopPropagation(); api?.scrollPrev(); }}
            aria-label="Anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            className="absolute right-2 sm:right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/35 transition-colors backdrop-blur-sm"
            onClick={(e) => { e.stopPropagation(); api?.scrollNext(); }}
            aria-label="Siguiente"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Carousel */}
      <div className="w-full h-full" onClick={(e) => e.stopPropagation()}>
        <Carousel
          setApi={setApi}
          opts={{ loop: true, dragFree: false }}
          className="w-full h-full"
        >
          <CarouselContent className="h-full -ml-0">
            {slides.map((slide, i) => (
              <CarouselItem key={i} className="pl-0 flex items-center justify-center h-full px-14 sm:px-20 py-4">
                {slide.type === "image" ? (
                  <div className="relative w-full h-full max-h-[90vh]">
                    <Image
                      src={slide.url}
                      alt={slide.alt || ""}
                      fill
                      className="object-contain"
                      sizes="100vw"
                      priority={i === initial}
                    />
                  </div>
                ) : (
                  <video
                    key={slide.url}
                    src={slide.url}
                    controls
                    autoPlay={i === initial}
                    playsInline
                    poster={slide.thumbnailUrl}
                    preload="metadata"
                    className="max-h-[88vh] max-w-full w-full rounded-lg"
                  />
                )}
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 pointer-events-none z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 pointer-events-auto",
                i === idx ? "w-6 bg-white" : "w-1.5 bg-white/40",
              )}
              onClick={(e) => { e.stopPropagation(); api?.scrollTo(i); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gallery — mainImage grande + strip de thumbnails pequeños debajo
// ---------------------------------------------------------------------------
const THUMB_MAX = 3; // thumbnails visibles junto al mainImage

function Gallery({
  mainImage,
  media,
  onOpen,
}: {
  mainImage: EventViewModel["mainImage"];
  media: MediaItem[];
  onOpen: (index: number) => void;
}) {
  const thumbs: Array<{
    type: "image" | "video";
    url: string;
    thumbnailUrl?: string;
    slideIndex: number;
  }> = [];

  let slideIndex = 0;
  // slide 0 = mainImage
  if (mainImage?.url) slideIndex = 1;

  for (const item of media) {
    if (item.type === "image") {
      const img = item as MediaImageItem;
      thumbs.push({ type: "image", url: img.data.url, slideIndex: slideIndex++ });
    } else {
      const vid = item as MediaVideoItem;
      const url = vid.data.url || vid.data.temporaryUrl || "";
      if (url) thumbs.push({ type: "video", url, thumbnailUrl: vid.data.thumbnailUrl, slideIndex: slideIndex++ });
    }
  }

  const visibleThumbs = thumbs.slice(0, THUMB_MAX);
  const hiddenCount = thumbs.length - THUMB_MAX;

  if (!mainImage?.url && thumbs.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Main image */}
      {mainImage?.url && (
        <button
          className="relative w-full overflow-hidden rounded-2xl aspect-[4/3] group focus:outline-none block"
          onClick={() => onOpen(0)}
          aria-label="Ver imagen principal"
        >
          <Image
            src={mainImage.url}
            alt="Imagen principal"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            priority
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-2xl" />
        </button>
      )}

      {/* Thumbnails strip */}
      {visibleThumbs.length > 0 && (
        <div className={`flex gap-2 ${visibleThumbs.length === 1 ? "justify-start" : ""}`}>
          {visibleThumbs.map((thumb, i) => {
            const isLast = i === visibleThumbs.length - 1 && hiddenCount > 0;
            const thumbUrl = thumb.type === "video" ? (thumb.thumbnailUrl || "") : thumb.url;
            const singleThumb = visibleThumbs.length === 1;

            return (
              <button
                key={i}
                className={`relative overflow-hidden rounded-xl group focus:outline-none min-w-0 ${
                  singleThumb
                    ? "w-[200px] h-[200px] shrink-0"
                    : "flex-1 h-[200px]"
                }`}
                onClick={() => onOpen(thumb.slideIndex)}
                aria-label={thumb.type === "video" ? "Ver video" : "Ver imagen"}
              >
                {thumbUrl ? (
                  <Image
                    src={thumbUrl}
                    alt=""
                    fill
                    sizes="20vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-800" />
                )}

                {thumb.type === "video" && !isLast && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                      <Play className="h-3 w-3 fill-white text-white" />
                    </div>
                  </div>
                )}

                {isLast && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 backdrop-blur-[2px] text-white rounded-xl">
                    <span className="text-lg font-bold leading-none">+{hiddenCount}</span>
                    <span className="text-[10px] mt-0.5 opacity-80">
                      {hiddenCount === 1 ? "contenido más" : "contenidos más"}
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-200 rounded-xl" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Map
// ---------------------------------------------------------------------------
function EventMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  if (!lat || !lng) return null;
  const src = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <iframe
        title={label}
        src={src}
        width="100%"
        height="240"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="block"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail row helper
// ---------------------------------------------------------------------------
function DetailRow({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
        <Icon className="h-4 w-4 text-gray-600" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
        <p className="font-semibold text-gray-900 text-sm leading-snug">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
interface EventDetailClientProps {
  event: EventViewModel;
  initialLiked: boolean;
  initialRegistered: boolean;
  /** True cuando el usuario que ve el evento es su organizador. */
  isOwner?: boolean;
  /** True cuando el organizador tiene cuenta profesional (acceso al Estudio). */
  isProfessionalOwner?: boolean;
  /** Ruta a compartir (usada por el detalle de sesión para compartir la sesión). */
  shareUrl?: string;
  /** Enlace de regreso (p.ej. al evento padre desde una sesión). */
  backLink?: { href: string; label: string };
  /** Si se pasa, el dueño ve un botón "Editar sesión" que apunta aquí. */
  editSessionHref?: string;
  /** Si se pasa, el like se registra contra la SESIÓN (detalle de sesión). */
  sessionId?: string;
}

export function EventDetailClient({ event, initialLiked, initialRegistered, isOwner = false, isProfessionalOwner = false, shareUrl, backLink, editSessionHref, sessionId }: EventDetailClientProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(initialRegistered);

  const registrations = event.analytics?.registrations ?? 0;
  const capacity = event.capacity ?? 0;
  const isOverCapacity = capacity > 0 && registrations >= capacity;
  // Over-capacity warning only relevant for modal-based flows (internal, form)
  const showCapacityWarning = isOverCapacity && (event.registrationType === "internal" || event.registrationType === "form");

  const slides = buildSlides(event.mainImage, event.media);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const [descriptionHtml, setDescriptionHtml] = useState("");

  useEffect(() => {
    if (!event.description) return;
    const raw = renderToHTMLString({
      content: event.description as Parameters<typeof renderToHTMLString>[0]["content"],
      extensions,
    });
    setDescriptionHtml(DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: ["p","br","strong","em","u","s","h1","h2","h3","h4","h5","h6","ul","ol","li","a","span","blockquote","code","pre","img"],
      ALLOWED_ATTR: ["href","target","rel","src","alt","class","style"],
    }));
  }, [event.description]);

  const { coordinates, country, department, city, venue, address, moreInfo } = event.location;
  const isFree = event.price.isFree;

  const registrationLabel: Record<string, string> = {
    none: "Sin registro",
    internal: "Registro en plataforma",
    external: "Registro externo",
    form: "Formulario personalizado",
  };

  return (
    <>
      {lightboxOpen && (
        <Lightbox
          slides={slides}
          initial={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Registration modal — lazy loaded only when opened */}
      {registrationModalOpen && (
        <Suspense fallback={null}>
          <EventRegistrationModal
            event={event}
            price={formatPrice(event.price)}
            isFree={isFree}
            capacity={capacity > 0 ? capacity : undefined}
            registrations={registrations}
            isOverCapacity={showCapacityWarning}
            onConfirm={async (formData) => {
              if (!event.id) return;
              const result = await registerEventAction({
                eventId: event.id,
                ...(sessionId ? { sessionId } : {}),
                registrationType: event.registrationType as "internal" | "form",
                ...(formData ? { formData: formData as Record<string, string | string[] | number | boolean | null | Record<string, unknown>> } : {}),
              });
              if (result.success || result.alreadyRegistered) {
                setIsRegistered(true);
              }
              return result;
            }}
            onClose={() => setRegistrationModalOpen(false)}
          />
        </Suspense>
      )}

      <Section spacing="md" as="article">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12 items-start">

          {/* ── LEFT: Gallery (sticky en desktop) ── */}
          <div className="lg:sticky lg:top-6">
            <Gallery
              mainImage={event.mainImage}
              media={event.media}
              onOpen={openLightbox}
            />
          </div>

          {/* ── RIGHT: Info ── */}
          <div className="space-y-5">

            {/* Volver al evento padre (detalle de sesión) */}
            {backLink && (
              <Link
                href={backLink.href}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                <ChevronLeft className="h-4 w-4" />
                Volver a {backLink.label}
              </Link>
            )}

            {/* Header: categoría + badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {event.categoryInfo?.title && (
                <Badge variant="secondary" className="text-xs">
                  {event.categoryInfo.title}
                </Badge>
              )}
              {isFree ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs">Gratis</Badge>
              ) : (
                <Badge className="bg-blue-50 text-blue-700 border-0 text-xs">
                  {formatPrice(event.price)}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight tracking-tight">
              {event.title}
            </h1>

            {/* Tags */}
            {event.categoryInfo?.tags && event.categoryInfo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {event.categoryInfo.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs text-gray-500 border-gray-200">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Author */}
            {event.author?.id ? (
              <Link
                href={buildProfileHref(event.author)}
                className="flex items-center gap-3 hover:underline"
                aria-label={`Ver perfil de ${event.author.displayName || "el organizador"}`}
              >
                <Avatar size="sm">
                  {event.author?.photoURL && (
                    <AvatarImage src={event.author.photoURL} alt={event.author.displayName} />
                  )}
                  <AvatarFallback>
                    <User className="h-4 w-4 text-gray-400" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-gray-500">Organizado por</p>
                  <p className="text-sm font-semibold text-gray-900">{event.author?.displayName || "Organizador"}</p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Avatar size="sm">
                  <AvatarFallback>
                    <User className="h-4 w-4 text-gray-400" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-gray-500">Organizado por</p>
                  <p className="text-sm font-semibold text-gray-900">Organizador</p>
                </div>
              </div>
            )}

            {/* Colaboradores acreditados */}
            <EventCollaboratorsDialog
              collaborators={event.collaborators}
              collaboratorsData={event.collaboratorsData}
            />

            {/* Like */}
            <EventDetailActions event={event} initialLiked={initialLiked} sessionId={sessionId} />

            {/* Compartir en redes sociales (registra el share en analytics) */}
            <SocialShareBar
              url={typeof window !== "undefined" ? `${window.location.origin}${shareUrl ?? `/eventos/${event.slug || event.id}`}` : `https://quehaypahacerapp.com${shareUrl ?? `/eventos/${event.slug || event.id}`}`}
              title={event.title}
              onShare={() => { void shareEventAction(event.id, sessionId); }}
            />

            <Separator />

            {/* Fechas y lugar */}
            <div className="space-y-4">
              <DetailRow icon={CalendarDays} label="Inicio" value={formatDate(event.startDate)} />
              <DetailRow icon={Clock} label="Fin" value={formatDate(event.endDate)} />
              <DetailRow
                icon={MapPin}
                label="Lugar"
                value={venue || [city?.name, department?.name].filter(Boolean).join(", ")}
                sub={[address, city?.name, department?.name, country?.name].filter(Boolean).join(", ")}
              />
              {moreInfo && <p className="text-xs text-gray-500 pl-11">{moreInfo}</p>}
            </div>

            <Separator />

            {/* Capacidad y registro */}
            <div className="space-y-4">
              {!isFree && (
                <DetailRow icon={DollarSign} label="Precio" value={formatPrice(event.price)} />
              )}
              {capacity > 0 ? (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <Users className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Capacidad</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="font-semibold text-gray-900 text-sm">
                        {capacity.toLocaleString("es-CO")} personas
                      </p>
                      {registrations > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isOverCapacity
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {registrations.toLocaleString("es-CO")} inscritos
                        </span>
                      )}
                    </div>
                    {capacity > 0 && (
                      <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOverCapacity ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min((registrations / capacity) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Registration box — always shown, behavior depends on registrationType */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-3 mt-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Registro</p>
                    <p className="text-sm text-gray-700">
                      {registrationLabel[event.registrationType] || event.registrationType}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-gray-900 shrink-0">{formatPrice(event.price)}</p>
                </div>

                {isOwner ? (
                  <div className="flex items-start gap-3 rounded-lg bg-gray-100 border border-gray-200 px-4 py-3">
                    <span className="text-gray-500 text-lg shrink-0">📋</span>
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium text-gray-800">
                        {editSessionHref ? "Esta sesión es tuya" : "Este es tu evento"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                      {isProfessionalOwner ? (
                        // Cuenta profesional → acceso al Estudio del Organizador.
                        <Link
                          href={`/studio/events/${event.id}`}
                          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Ir a estudio
                        </Link>
                      ) : event.registrationType === "internal" || event.registrationType === "form" ? (
                        // Cuenta normal → modal simple con la lista de inscritos.
                        <EventAttendeesDialog
                          eventId={event.id}
                          eventTitle={event.title}
                          trigger={
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
                            >
                              <Users className="h-4 w-4" />
                              Ver inscritos
                            </button>
                          }
                        />
                      ) : !editSessionHref ? (
                        <p className="text-xs text-gray-500">
                          Este evento no recolecta inscripciones en la plataforma.
                        </p>
                      ) : null}
                      {editSessionHref && (
                        <Link
                          href={editSessionHref}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar sesión
                        </Link>
                      )}
                      </div>
                    </div>
                  </div>
                ) : event.registrationType === "none" ? (
                  <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
                    <span className="text-blue-500 text-lg shrink-0">🎉</span>
                    <p className="text-sm text-blue-800">
                      Este evento es <strong>abierto al público</strong>. No es necesario registrarse — ¡solo preséntate el día del evento!
                    </p>
                  </div>
                ) : isRegistered && (event.registrationType === "internal" || event.registrationType === "form") ? (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                    <span className="text-green-600 text-lg">✅</span>
                    <p className="text-sm font-medium text-green-800">Ya estás registrado en este evento</p>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (event.registrationType === "external") {
                          if (event.externalUrl) {
                            // Registra el click ANTES de redirigir (no bloqueante).
                            void recordExternalRegistrationClickAction(event.id);
                            window.open(event.externalUrl, "_blank", "noopener,noreferrer");
                          }
                        } else {
                          setRegistrationModalOpen(true);
                        }
                      }}
                      className={`w-full rounded-lg px-6 py-3 text-sm font-bold text-white transition-colors ${
                        showCapacityWarning
                          ? "bg-amber-500 hover:bg-amber-600"
                          : "bg-gray-900 hover:bg-gray-700"
                      }`}
                    >
                      Registrarse
                    </button>
                    {event.registrationType === "external" && event.externalUrl && (
                      <p className="text-center text-xs text-gray-500">
                        Serás redirigido a un sitio externo para completar tu inscripción
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            {descriptionHtml && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h2 className="text-base font-bold text-gray-900">Descripción</h2>
                  <ExpandableDescription html={descriptionHtml} />
                </div>
              </>
            )}

            {/* Map */}
            {coordinates?.lat && coordinates?.lng && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h2 className="text-base font-bold text-gray-900">Ubicación</h2>
                  <EventMap lat={coordinates.lat} lng={coordinates.lng} label={venue || event.title} />
                </div>
              </>
            )}

          </div>
        </div>
      </Section>
    </>
  );
}
