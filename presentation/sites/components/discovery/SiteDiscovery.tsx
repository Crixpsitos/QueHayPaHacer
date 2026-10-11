"use client";

import Link from "next/link";
import Image from "next/image";
import { useSyncExternalStore } from "react";
import {
  MapPin,
  CalendarDays,
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
import { siteCategoryLabel } from "../../lib/constants";
import { getSiteOpenStatus } from "../../lib/openStatus";

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

  // Solo en el cliente: new Date() no está permitido durante el prerender (y evita mismatch de hidratación).
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const openStatus = isClient ? getSiteOpenStatus(site.schedule) : null;

  return (
    <Link
      href={`/donde-ir/${site.slug || site.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white transition-colors hover:border-[#09090B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946] focus-visible:ring-offset-2"
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-[#F4F4F5]">
        {site.coverUrl ? (
          <Image
            src={site.coverUrl}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes={CARD_SIZES}
            priority={prioritize}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CatIcon className="size-10 text-[#A1A1AA]" aria-hidden="true" />
          </div>
        )}
        {openStatus?.label && (
          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-[#09090B] shadow-sm">
            <span
              className={cn("size-1.5 rounded-full", openStatus.isOpen ? "bg-emerald-500" : "bg-[#A1A1AA]")}
              aria-hidden="true"
            />
            {openStatus.isOpen ? "Abierto ahora" : "Cerrado"}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs font-medium text-[#E63946]">{siteCategoryLabel(site.category)}</p>
        <h3 className="font-heading text-base font-semibold leading-snug text-[#09090B] line-clamp-2 group-hover:underline">
          {site.name}
        </h3>
        {site.address && (
          <p className="flex items-start gap-1 text-sm text-[#71717A]">
            <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span className="line-clamp-1">{site.address}</span>
          </p>
        )}
        {eventCount > 0 && (
          <p className="mt-auto flex items-center gap-1 pt-1 text-xs font-medium text-[#52525B]">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
            {eventCount} {eventCount === 1 ? "evento" : "eventos"}
          </p>
        )}
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
      {sites.map((s, index) => (
        <SiteDiscoveryCard key={s.id} site={s} prioritize={index < 4} />
      ))}
    </div>
  );
}
