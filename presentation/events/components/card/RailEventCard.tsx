"use client";

import Image from "next/image";
import Link from "@/app/components/ui/navigation/IntentLink"
import { useState, useSyncExternalStore } from "react";
import { useOptimisticLike } from "@/presentation/shared/hooks/useOptimisticLike";
import { cn } from "@/app/lib/utils/cn";
import { DateChip } from "@/presentation/home/components/DateChip";
import { CardLikeButton } from "./CardLikeButton";
import { compactCount, goingLabel, registrationLabel, spotsInfo, timingBadge } from "./cardMeta";
import { EventViewModel } from "../../view-models/EventViewModel";
import { dateParts, formatPrice } from "../detail/format";
import { dateLine } from "./EventCard";

/** "20:00" → "8:00 pm" (el diseño usa 12 horas). */
const h12 = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "pm" : "am"}`; };
const TIME_24 = /\b([01]?\d|2[0-3]):([0-5]\d)$/;
const whenLine = (event: EventViewModel) => dateLine(event).replace(TIME_24, (t) => h12(t));

const noopSubscribe = () => () => {};
const FALLBACK = ["bg-wine", "bg-primary", "bg-brand-gold", "bg-primary-dark", "bg-sand"];

/**
 * Tarjeta de evento de los carriles del Home (diseño «tarjeta limpia»): foto con fecha, cuándo y tipo de fecha; debajo categoría,
 * inscripción, título, fecha, lugar, precio y cuántos van o cuántos cupos quedan, más las vistas. El corazón es el «Voy a ir» de siempre.
 */
export function RailEventCard({ event, initialLiked, onLike, index = 0 }: { event: EventViewModel; initialLiked?: boolean; onLike?: (eventId: string, liked: boolean) => boolean | Promise<boolean>; index?: number }) {
  const { liked, count: likes, toggle } = useOptimisticLike(initialLiked ?? false, event.analytics?.likes ?? 0, async (next) => (await onLike?.(event.id, next)) !== false);
  const [imageFailed, setImageFailed] = useState(false);
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const multi = event.eventType === "multi-date";
  const imageUrl = !imageFailed && event.mainImage?.status !== "error" ? event.mainImage?.url : undefined;
  const stub = event.startDate ? dateParts(event.startDate) : null;
  const timing = isClient ? timingBadge(event.startDate, event.endDate, new Date(), multi) : null;
  const spots = spotsInfo(event.capacity, event.analytics?.registrations ?? 0);
  const views = event.analytics?.views ?? 0;
  const place = !multi && event.location ? [event.location.venue, event.location.address].filter(Boolean).join(", ") : "";
  const price = formatPrice(event.price) || "Ver precios"; // varias fechas: el precio está en cada función
  const when = timing?.label ?? (stub ? `${stub.weekdayShort.charAt(0).toUpperCase()}${stub.weekdayShort.slice(1)} ${stub.day}` : "");
  const href = `/eventos/${event.slug || event.id}`;

  return (
    <article className="group relative">
      <Link href={href} className="block text-foreground outline-none">
        <span className={cn("relative block h-44 overflow-hidden rounded-[1.125rem] group-focus-within:ring-3 group-focus-within:ring-ring/50 sm:h-51", !imageUrl && FALLBACK[index % FALLBACK.length])}>
          {imageUrl ? <Image src={imageUrl} alt="" fill sizes="280px" onError={() => setImageFailed(true)} className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none" /> : null}
          {stub ? <DateChip small wd={stub.weekdayShort} day={stub.day} mon={stub.monthShort} className="absolute left-3 top-3" /> : null}
          <span className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {when ? <span className="rounded-full bg-primary-dark px-2.5 py-1 text-xs font-semibold text-white ring-[1.5px] ring-white/90">{when}</span> : null}
            <span className="rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-wine">{multi ? "Varias fechas" : "Una fecha"}</span>
          </span>
        </span>
        <span className="block px-0.5 pt-3">
          <span className="mb-0.5 flex justify-between gap-2 text-xs">
            <span className="truncate font-semibold text-primary">{event.categoryInfo?.title}</span>
            <span className="shrink-0 text-muted-foreground">{registrationLabel(event.registrationType)}</span>
          </span>
          <span className="block truncate text-base font-semibold leading-snug">{event.title}</span>
          <span className="block truncate text-sm text-muted-foreground">{whenLine(event)}</span>
          {place ? <span className="block truncate text-sm text-muted-foreground">{place}</span> : null}
          <span className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-2.5">
            <span className="whitespace-nowrap text-[0.9375rem] font-semibold">{price}</span>
            <span className="whitespace-nowrap text-right text-xs text-muted-foreground">
              {spots ? spots.label : likes > 0 ? goingLabel(likes) : null}
              {(spots || likes > 0) && views > 0 ? " · " : null}
              {views > 0 ? `${compactCount(views)} vistas` : null}
            </span>
          </span>
        </span>
      </Link>
      <CardLikeButton liked={liked} onToggle={toggle} />
    </article>
  );
}
