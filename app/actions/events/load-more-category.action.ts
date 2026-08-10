"use server";

import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getCategoryEventsPage } from "@/presentation/events/data/categoryEventsPage";
import { fetchUserLiked } from "@/presentation/events/data/eventDetailFetchers";
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper";
import type { EventViewModel } from "@/presentation/events/view-models/EventViewModel";

interface LoadMoreResult {
  events: EventViewModel[];
  likedByEventId: Record<string, boolean>;
  nextCursor: string | null;
}

/**
 * "Cargar más" de una landing de categoría. Trae la siguiente página por cursor
 * + el like del usuario para esos eventos. Dinámico (sin caché) — es acción del
 * usuario; los detalles de evento sí salen de caché.
 */
export async function loadMoreCategoryEventsAction(
  categoryId: string,
  cursor: string | null,
  categorySlug?: string,
): Promise<LoadMoreResult> {
  const { events, nextCursor } = await getCategoryEventsPage(categoryId, cursor, undefined, categorySlug);

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
