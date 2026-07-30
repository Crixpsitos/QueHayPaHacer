"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button/button";
import { EventCardInteractive } from "@/presentation/events/components/card/EventCardInteractive";
import { loadMoreExploreSearchAction } from "@/app/actions/explore/load-more-explore-search.action";
import type { EventViewModel } from "@/presentation/events/view-models/EventViewModel";
import type { ExploreFilters } from "@/presentation/events/data/exploreFetchers";

const INFO = {
  title: "No hay más eventos",
  description: "Has llegado al final de los resultados.",
};

interface InfiniteExploreSearchProps {
  q: string;
  from?: string;
  to?: string;
  filters?: ExploreFilters;
  initialEvents: EventViewModel[];
  initialHasMore: boolean;
}

export function InfiniteExploreSearch({
  q,
  from,
  to,
  filters = {},
  initialEvents,
  initialHasMore,
}: InfiniteExploreSearchProps) {
  const [events, setEvents] = useState(initialEvents);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      const res = await loadMoreExploreSearchAction(q, from, to, page, filters);
      setEvents((prev) => [...prev, ...res.events]);
      setHasMore(res.hasMore);
      setPage((p) => p + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <EventCardInteractive events={events} info={INFO} variant="vertical" />
      {hasMore && (
        <div className="flex justify-center">
          <Button onClick={loadMore} disabled={loading} variant="outline" className="h-11 rounded-2xl px-8">
            {loading ? "Cargando..." : "Ver más eventos"}
          </Button>
        </div>
      )}
    </div>
  );
}
