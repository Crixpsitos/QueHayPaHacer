import Image from "next/image";
import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { siteCategoryLabel } from "@/presentation/sites/lib/constants";
import { cn } from "@/app/lib/utils/cn";
import type { EventViewModel } from "../../view-models/EventViewModel";
import { formatDateLong, formatTimeRange, sameDay, formatTime } from "./format";

export interface LinkedSiteInfo {
  id: string;
  slug: string;
  name: string;
  category: string;
  address: string;
  coverUrl: string;
  isOpen: boolean;
  openLabel: string;
}

export function LinkedSiteCard({ site }: { site: LinkedSiteInfo }) {
  return (
    <Link
      href={`/donde-ir/${site.slug || site.id}`}
      className="group flex items-center gap-4 rounded-2xl border border-[#E4E4E7] bg-white p-3 transition-colors hover:border-[#09090B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946] focus-visible:ring-offset-2"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-[#F4F4F5]">
        {site.coverUrl && <Image src={site.coverUrl} alt="" fill className="object-cover" sizes="64px" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[#71717A]">Se realiza en</p>
        <p className="truncate font-semibold text-[#09090B]">{site.name}</p>
        <p className="truncate text-sm text-[#71717A]">
          {siteCategoryLabel(site.category)}
          {site.address && `, ${site.address}`}
        </p>
        <p className={cn("mt-0.5 flex items-center gap-1.5 text-xs font-medium", site.isOpen ? "text-emerald-700" : "text-[#71717A]")}>
          <span className={cn("size-1.5 rounded-full", site.isOpen ? "bg-emerald-500" : "bg-[#D4D4D8]")} aria-hidden="true" />
          {site.openLabel}
        </p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-[#A1A1AA] transition-transform group-hover:translate-x-0.5 group-hover:text-[#09090B]" aria-hidden="true" />
    </Link>
  );
}

/** "Cuándo y dónde": fecha larga, horario, lugar, mapa y sitio vinculado. */
export function EventPlace({ event, linkedSite }: { event: EventViewModel; linkedSite?: LinkedSiteInfo }) {
  const { coordinates, country, department, city, venue, address, moreInfo } = event.location;
  const hasMap = Boolean(coordinates?.lat && coordinates?.lng);
  const place = venue || [city?.name, department?.name].filter(Boolean).join(", ");
  const fullAddress = [address, ...[city?.name, department?.name, country?.name].filter((p) => p && !address?.includes(p))]
    .filter(Boolean)
    .join(", ");
  const mapsHref = hasMap
    ? `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`
    : fullAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
      : null;
  const oneDay = sameDay(event.startDate, event.endDate);

  return (
    <section aria-labelledby="cuando-donde" className="space-y-6">
      <h2 id="cuando-donde" className="font-heading text-2xl font-semibold tracking-tight text-[#09090B]">
        Cuándo y dónde
      </h2>

      <dl className="grid gap-x-10 gap-y-5 border-y border-[#E4E4E7] py-6 sm:grid-cols-2">
        <div className="space-y-1">
          <dt className="text-sm text-[#71717A]">Fecha</dt>
          <dd className="font-medium text-[#09090B] first-letter:uppercase">
            {oneDay ? (
              formatDateLong(event.startDate)
            ) : (
              <>
                {formatDateLong(event.startDate)}, {formatTime(event.startDate)}
                <span className="block text-[#71717A]">
                  hasta el {formatDateLong(event.endDate)}, {formatTime(event.endDate)}
                </span>
              </>
            )}
          </dd>
          {oneDay && <dd className="tabular-nums text-[#52525B]">{formatTimeRange(event.startDate, event.endDate)}</dd>}
        </div>
        <div className="space-y-1">
          <dt className="text-sm text-[#71717A]">Lugar</dt>
          <dd className="font-medium text-[#09090B]">{place || "Por confirmar"}</dd>
          {fullAddress && <dd className="text-[#52525B]">{fullAddress}</dd>}
          {moreInfo && <dd className="text-sm text-[#71717A]">{moreInfo}</dd>}
          {mapsHref && (
            <dd className="pt-1">
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#09090B] underline decoration-[#E4E4E7] underline-offset-4 hover:decoration-[#09090B]"
              >
                <MapPin className="size-4" aria-hidden="true" />
                Ver en el mapa
              </a>
            </dd>
          )}
        </div>
      </dl>

      {linkedSite && <LinkedSiteCard site={linkedSite} />}

      {hasMap && (
        <div className="overflow-hidden rounded-2xl border border-[#E4E4E7] bg-[#F4F4F5]">
          <iframe
            title={`Mapa de ${venue || event.title}`}
            src={`https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}&z=15&output=embed`}
            width="100%"
            height="280"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block"
          />
        </div>
      )}
    </section>
  );
}
