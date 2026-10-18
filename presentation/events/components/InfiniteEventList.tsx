"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button/button";
import { EventCardInteractive } from "./card/EventCardInteractive";
import type { EventViewModel } from "../view-models/EventViewModel";
import { loadMoreCategoryEventsAction } from "@/app/actions/events/load-more-category.action";
import { loadMoreAllEventsAction } from "@/app/actions/events/load-more-all.action";

interface InfiniteEventListProps {
  /** Sin categoryId → lista "Todos los eventos". */
  categoryId?: string;
  categorySlug?: string;
  initialEvents: EventViewModel[];
  initialCursor: string | null;
  initialLikedByEventId: Record<string, boolean>;
}

/**
 * Lista de eventos con "Cargar más" (cursor). La primera página llega del server
 * (cacheada, en el hueco PPR); las siguientes por server action, sin caché.
 */
export function InfiniteEventList({
  categoryId,
  categorySlug,
  initialEvents,
  initialCursor,
  initialLikedByEventId,
}: InfiniteEventListProps) {
  const [events, setEvents] = useState(initialEvents);
  const [likedByEventId, setLikedByEventId] = useState(initialLikedByEventId);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = categoryId
        ? await loadMoreCategoryEventsAction(categoryId, cursor, categorySlug)
        : await loadMoreAllEventsAction(cursor);
      setEvents((prev) => [...prev, ...res.events.filter((e) => !prev.some((p) => p.id === e.id))]);
      setLikedByEventId((prev) => ({ ...prev, ...res.likedByEventId }));
      setCursor(res.nextCursor);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <EventCardInteractive
        events={events}
        likedByEventId={likedByEventId}
        info={{
          title: categoryId ? "Todavía no hay eventos en esta categoría" : "Todavía no hay eventos publicados",
          description: categoryId
            ? "Estamos sumando planes nuevos. Vuelve pronto."
            : "Mientras tanto, mira los sitios para salir en Ibagué.",
          action: categoryId
            ? { href: "/eventos", label: "Ver todos los eventos" }
            : { href: "/donde-ir", label: "Ver sitios" },
        }}
        variant="vertical"
      />

      {cursor && (
        <div className="flex justify-center">
          <Button onClick={loadMore} disabled={loading} aria-busy={loading} variant="outline" className="min-h-11 min-w-36 transition-transform duration-150 active:scale-[0.97] motion-reduce:active:scale-100">
            {loading && <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />}
            {loading ? "Cargando…" : "Cargar más"}
          </Button>
        </div>
      )}
    </div>
  );
}
