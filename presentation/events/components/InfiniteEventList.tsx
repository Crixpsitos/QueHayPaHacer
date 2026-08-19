"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button/button";
import { EventCardInteractive } from "./card/EventCardInteractive";
import type { EventViewModel } from "../view-models/EventViewModel";
import { loadMoreCategoryEventsAction } from "@/app/actions/events/load-more-category.action";

interface InfiniteEventListProps {
  categoryId: string;
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
      const res = await loadMoreCategoryEventsAction(categoryId, cursor, categorySlug);
      setEvents((prev) => [...prev, ...res.events]);
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
          title: "Todavía no hay eventos en esta categoría",
          description: "Estamos sumando planes nuevos. Vuelve pronto.",
        }}
        variant="vertical"
      />

      {cursor && (
        <div className="flex justify-center">
          <Button onClick={loadMore} disabled={loading} variant="outline">
            {loading ? "Cargando..." : "Cargar más"}
          </Button>
        </div>
      )}
    </div>
  );
}
