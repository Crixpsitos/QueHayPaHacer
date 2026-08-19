"use server";

import { fetchExploreResults, type ExploreFilters } from "@/presentation/events/data/exploreFetchers";
import type { EventViewModel } from "@/presentation/events/view-models/EventViewModel";

interface LoadMoreSearchResult {
  events: EventViewModel[];
  hasMore: boolean;
}

export async function loadMoreExploreSearchAction(
  q: string,
  from: string | undefined,
  to: string | undefined,
  page: number,
  filters: ExploreFilters = {},
): Promise<LoadMoreSearchResult> {
  const data = await fetchExploreResults(q, from, to, page, filters);
  return { events: data.events, hasMore: data.hasMoreEvents };
}
