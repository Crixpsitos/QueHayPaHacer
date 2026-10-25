"use client";

import Link from "next/link";
import Image from "next/image";
import { useSyncExternalStore, type CSSProperties } from "react";
import {
  MapPin,
  CalendarDays,
  CalendarCheck,
  Camera,
  Clock,
  Heart,
  Coffee,
  UtensilsCrossed,
  Beer,
  Music2,
  ShoppingBag,
  Trees,
  Landmark,
  Theater,
  Mountain,
  BedDouble,
  Building2,
  Dumbbell,
  Sparkles,
  MapPinned,
} from "lucide-react";
import { SiteItemListJsonLd } from "./SiteJsonLd";
import type { SiteDetail } from "../../view-models/SiteFormViewModel";
import { cn } from "@/app/lib/utils/cn";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { compactCount, plainText } from "@/presentation/events/components/card/cardMeta";
import { siteCategoryLabel } from "../../lib/constants";
import { getSiteOpenStatus } from "../../lib/openStatus";
import { useColombiaHolidays } from "../../hooks/useColombiaHolidays";
import { TrustBadge } from "../TrustBadge";
import { SiteEventsBadge } from "../SiteEventsBadge";

/** Icono de respaldo cuando el sitio no tiene portada. */
const CATEGORY_ICON: Record<string, React.ElementType> = {
  restaurant: UtensilsCrossed, cafe: Coffee, bar: Beer, discotheque: Music2,
  mall: ShoppingBag, park: Trees, museum: Landmark, cultural: Theater,
  viewpoint: Mountain, hostel: BedDouble, hotel: Building2, gym: Dumbbell,
  spa: Sparkles, theater: Theater, other: MapPinned,
};

/** Columnas del grid y `sizes` de la imagen van juntos: si cambias uno, cambia el otro. */
const GRID_CLASS = "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
const CARD_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 300px";

const noopSubscribe = () => () => {};

// ─── Card ────────────────────────────────────────────────────────────────────

export function SiteDiscoveryCard({ site, prioritize = false }: { site: SiteDetail; prioritize?: boolean }) {
  const CatIcon = CATEGORY_ICON[site.category] ?? MapPinned;
  const eventCount = site.analytics?.eventCount ?? 0;
  const likes = site.analytics?.likes ?? 0;
  const photoCount = site.mediaItems?.length ?? site.mediaUrls?.length ?? 0;
  const description = plainText(site.description);
  const authorName = site.author?.displayName?.trim() || "Comunidad";

  // Solo en el cliente: new Date() no está permitido durante el prerender (y evita mismatch de hidratación).
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const holidays = useColombiaHolidays();
  const openStatus = isClient ? getSiteOpenStatus(site.schedule, new Date(), { holidays, policy: site.openingPolicy }) : null;
  const closedForNow = site.temporarilyClosed?.isClosed === true;

  return (
    <Link
      href={`/donde-ir/${site.slug || site.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white transition-[transform,border-color,box-shadow] duration-300 motion-reduce:transition-none hover:border-[#09090B] hover:shadow-card motion-safe:[@media(hover:hover)]:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946] focus-visible:ring-offset-2"
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-[#F4F4F5]">
        {site.coverUrl ? (
          <Image
            src={site.coverUrl}
            alt=""
            fill
            className="object-cover transition-transform duration-300 motion-reduce:transition-none group-hover:scale-[1.03] group-focus-visible:scale-[1.03] motion-reduce:group-hover:scale-100 motion-reduce:group-focus-visible:scale-100"
            sizes={CARD_SIZES}
            priority={prioritize}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CatIcon className="size-10 text-[#A1A1AA]" aria-hidden="true" />
          </div>
        )}
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/45 to-transparent" />

        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#09090B] shadow-sm">
          <CatIcon className="size-3.5 text-[#E63946]" aria-hidden="true" />
          {siteCategoryLabel(site.category)}
        </span>
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          <TrustBadge site={site} className="justify-end shadow-sm" />
          {photoCount > 1 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-xs font-medium tabular-nums text-white backdrop-blur-sm">
              <Camera className="size-3.5" aria-hidden="true" />
              <span className="sr-only">Fotos:</span>
              {photoCount}
            </span>
          )}
        </div>

        <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-end gap-1.5">
          {closedForNow ? (
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#09090B] shadow-sm">
              <span className="size-1.5 shrink-0 rounded-full bg-[#E63946]" aria-hidden="true" />
              Cerrado temporalmente
            </span>
          ) : openStatus?.label ? (
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-[#09090B] shadow-sm">
              <span
                className={cn("size-1.5 shrink-0 rounded-full", openStatus.isOpen ? "bg-emerald-500" : "bg-[#A1A1AA]")}
                aria-hidden="true"
              />
              {openStatus.label}
            </span>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap gap-1.5">
            {site.bookingUrl && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#09090B] shadow-sm">
                <CalendarCheck className="size-3.5 text-[#E63946]" aria-hidden="true" />
                Reservas
              </span>
            )}
            <SiteEventsBadge count={eventCount} variant="pill" />
            {site.isNew && (
              <span className="rounded-full bg-[#FFB703] px-2.5 py-1 text-xs font-semibold text-[#09090B]">Nuevo</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-heading line-clamp-2 text-lg font-semibold leading-snug text-[#09090B] decoration-[#E63946] decoration-2 underline-offset-4 group-hover:underline group-focus-visible:underline">
          {site.name}
        </h3>

        {description && <p className="line-clamp-2 text-sm leading-relaxed text-[#52525B]">{description}</p>}

        <ul className="mt-1 space-y-1.5 text-sm text-[#3F3F46]">
          {site.address && (
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-[#A1A1AA]" aria-hidden="true" />
              <span className="line-clamp-1">{site.address}</span>
            </li>
          )}
          {/* El horario de hoy se calcula en el cliente: se reserva la fila para no mover el diseño. */}
          <li className="flex min-h-5 items-start gap-2">
            <Clock className="mt-0.5 size-4 shrink-0 text-[#A1A1AA]" aria-hidden="true" />
            <span className="line-clamp-1 tabular-nums">
              {closedForNow
                ? site.temporarilyClosed?.reason?.trim() || "Cerrado por ahora"
                : openStatus?.todayHours
                  ? `Hoy ${openStatus.todayHours}`
                  : openStatus?.label === "Cerrado hoy"
                    ? "Hoy cerrado"
                    : "\u00a0"}
            </span>
          </li>
        </ul>

        <div className="mt-auto border-t border-dashed border-[#E4E4E7] pt-3">
          <div className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <Avatar className="size-6">
                {site.author?.photoURL && <AvatarImage src={site.author.photoURL} alt="" />}
                <AvatarFallback className="text-[10px]">{authorName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="truncate text-xs text-[#52525B]">{authorName}</span>
            </span>
            <span className="flex shrink-0 items-center gap-3 text-xs tabular-nums text-[#52525B]">
              {eventCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  {eventCount} {eventCount === 1 ? "evento" : "eventos"}
                </span>
              )}
              {likes > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Heart className="size-3.5" aria-hidden="true" />
                  {compactCount(likes)}
                  <span className="sr-only">me gusta</span>
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

export function SiteDiscoveryGrid({ sites }: { sites: SiteDetail[] }) {
  if (sites.length === 0) {
    return (
      <div className="py-16 text-center">
        <h3 className="text-xl font-semibold text-[#09090B]">Todavía no hay lugares aquí</h3>
        <p className="mt-2 text-sm text-[#71717A]">
          Estamos sumando sitios constantemente. Vuelve pronto para descubrir dónde ir.
        </p>
      </div>
    );
  }

  return (
    <div className={GRID_CLASS}>
      <SiteItemListJsonLd sites={sites} />
      {sites.map((s, index) =>
        index < 4 ? (
          <div
            key={s.id}
            className={cn("card-rise h-full", index === 0 && "card-rise-first")}
            style={{ "--i": index } as CSSProperties}
          >
            <SiteDiscoveryCard site={s} prioritize />
          </div>
        ) : (
          <div key={s.id} className="card-reveal h-full">
            <SiteDiscoveryCard site={s} />
          </div>
        ),
      )}
    </div>
  );
}
