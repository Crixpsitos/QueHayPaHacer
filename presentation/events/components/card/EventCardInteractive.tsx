"use client";
import type { CSSProperties } from "react";
import Link from "@/app/components/ui/navigation/IntentLink"
import type { EventViewModel } from "@/presentation/events/view-models/EventViewModel";
import { useMemo } from "react";
import { EventCard } from "./EventCard";
import { RailEventCard } from "./RailEventCard";
import { RAIL_CLASS, RAIL_ITEM_CLASS } from "@/app/components/layout/shared/Rail";
import { cn } from "@/app/lib/utils/cn";
import { useEventLikes } from "../../hooks/useEventLikes";

interface EventCardInteractiveProps {
  events: EventViewModel[];
  likedByEventId?: Record<string, boolean>;
  /** Estado vacío (no es un error: los errores van al error boundary). */
  info: { title: string; description?: string; action?: { href: string; label: string } };
  /** «rail»: carril que se desliza hacia el lado con la tarjeta limpia del Home (necesita `railId`). */
  variant?: "horizontal" | "vertical" | "rail";
  railId?: string;
  /** Máximo de columnas en modo vertical (default 4). */
  columns?: 2 | 3 | 4;
}

export function EventCardInteractive({
  events,
  likedByEventId = {},
  info,
  variant = "horizontal",
  railId,
  columns = 4,
}: EventCardInteractiveProps) {
  const eventIds = useMemo(() => events.map((e) => e.id), [events]);
  const { likes: effectiveLikes, onLike: handleLike, overlays } = useEventLikes(eventIds, likedByEventId);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-14 text-center">
        <p className="font-heading text-lg font-semibold text-[#09090B]">{info.title}</p>
        {info.description && (
          <p className="mt-1 max-w-md text-sm leading-relaxed text-[#71717A]">{info.description}</p>
        )}
        {info.action && (
          <Link
            href={info.action.href}
            className="mt-5 inline-flex h-11 items-center rounded-full bg-[#09090B] px-6 text-sm font-semibold text-white transition-[transform,background-color] duration-150 hover:bg-[#27272A] active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42F3C] focus-visible:ring-offset-2"
          >
            {info.action.label}
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <div id={variant === "rail" ? railId : undefined} className={cn(
        variant === "rail" ? RAIL_CLASS : variant === "vertical"
          ? `grid grid-cols-1 sm:grid-cols-2 ${columns >= 3 ? "lg:grid-cols-3" : ""} ${columns >= 4 ? "xl:grid-cols-4" : ""} gap-6`
          : "flex flex-wrap gap-6"
      )}>
        {events.map((event, index) => {
          if (variant === "rail") {
            return (
              <div key={event.id} className={RAIL_ITEM_CLASS}>
                <RailEventCard event={event} index={index} initialLiked={effectiveLikes[event.id] ?? false} onLike={handleLike} />
              </div>
            );
          }
          const card = (
            <EventCard
              event={event}
              attendeeCount={event.analytics?.registrations ?? 0}
              initialLiked={effectiveLikes[event.id] ?? false}
              onLike={handleLike}
              prioritizeImage={index === 0}
            />
          );
          // Entrada solo con CSS: las primeras suben al cargar; el resto aparece al hacer scroll.
          if (variant !== "vertical") return <div key={event.id} className="contents">{card}</div>;
          return index < 4 ? (
            <div
              key={event.id}
              className={cn("card-rise h-full", index === 0 && "card-rise-first")}
              style={{ "--i": index } as CSSProperties}
            >
              {card}
            </div>
          ) : (
            <div key={event.id} className="card-reveal h-full">{card}</div>
          );
        })}
      </div>

      {overlays}
    </>
  );
}