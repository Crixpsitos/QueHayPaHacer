"use server";

import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getAllEventsPage } from "@/presentation/events/data/allEventsPage";
import { fetchUserLiked } from "@/presentation/events/data/eventDetailFetchers";
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper";
import type { EventViewModel } from "@/presentation/events/view-models/EventViewModel";

interface LoadMoreResult {
  events: EventViewModel[];
  likedByEventId: Record<string, boolean>;
  nextCursor: string | null;
}

/**
 * "Cargar más" de "Todos los eventos". Pública: no recibe uid (el like se toma de
 * la sesión, si la hay). Los IDs y detalles salen de caché.
 */
export async function loadMoreAllEventsAction(cursor: string | null): Promise<LoadMoreResult> {
  const { events, nextCursor } = await getAllEventsPage(cursor);

  const tokens = await getTokens(await cookies(), authConfig);
  const userId = tokens?.decodedToken?.uid;

  const likedByEventId: Record<string, boolean> = {};
  if (userId) {
    const results = await Promise.all(
      events.map(async (e) => ({ id: e.id, liked: await fetchUserLiked(e.id, userId) })),
    );
    for (const { id, liked } of results) likedByEventId[id] = liked;
  }

  return {
    events: events.map((e) => EventViewModelMapper.toViewModel(e)),
    likedByEventId,
    nextCursor,
  };
}
