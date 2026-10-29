import Image from "next/image";
import { Sparkles, Star } from "lucide-react";
import type { EventViewModel } from "../../view-models/EventViewModel";

const chip = "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-black/5";

/** Chips del evento: categoría, fecha corta / "Varias fechas", destacado, primer evento. */
export function EventChips({ event, dateLabel }: { event: EventViewModel; dateLabel?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {event.categoryInfo?.title && <span className={`${chip} bg-white text-[#09090B]`}>{event.categoryInfo.title}</span>}
      {dateLabel && <span className={`${chip} bg-white text-[#09090B] tabular-nums`}>{dateLabel}</span>}
      {event.promotion?.isPromoted && (
        <span className={`${chip} bg-[#FFB703] text-[#09090B]`}>
          <Star className="size-3 fill-current" aria-hidden="true" />
          Destacado
        </span>
      )}
      {event.metadata?.isFirstEvent && (
        <span className={`${chip} bg-[#FFF8E7] text-[#8A5A00]`}>
          <Sparkles className="size-3" aria-hidden="true" />
          Primer evento
        </span>
      )}
    </div>
  );
}

/**
 * Imagen principal 21:9 (4:3 en móvil) con chips encima. Si se pasa `onOpen`,
 * la imagen abre la galería.
 */
export function EventHero({
  event,
  dateLabel,
  onOpen,
}: {
  event: EventViewModel;
  dateLabel?: string;
  onOpen?: () => void;
}) {
  const url = event.mainImage?.url;
  if (!url) {
    return (
      <div className="mb-2">
        <EventChips event={event} dateLabel={dateLabel} />
      </div>
    );
  }

  const img = (
    <Image
      src={url}
      alt={`Imagen principal de ${event.title}`}
      fill
      sizes="(max-width: 1280px) 100vw, 1216px"
      className="object-cover"
      preload
    />
  );

  return (
    <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl bg-[#F4F4F5] sm:aspect-21/9">
      {onOpen ? (
        <button type="button" onClick={onOpen} className="absolute inset-0 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D42F3C]" aria-label="Ver imagen en grande">
          {img}
        </button>
      ) : (
        img
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/35 to-transparent" />
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5">
        <EventChips event={event} dateLabel={dateLabel} />
      </div>
    </div>
  );
}
