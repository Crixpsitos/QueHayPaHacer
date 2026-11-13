"use server";

import { fetchSiteLinkedEvents } from "@/presentation/sites/data/siteDetailFetchers";
import type { EventViewModel } from "@/presentation/events/view-models/EventViewModel";

type Result =
  | { success: true; events: EventViewModel[] }
  | { success: false; error: string };

export async function getEventsBySiteAction(siteId: string): Promise<Result> {
  if (typeof siteId !== "string" || !siteId.trim() || siteId.length > 128) return { success: false, error: "siteId requerido." };
  try {
    // Misma lectura cacheada (horas, etiquetas `site-<id>` y `event-list`) que el itinerario de la ficha.
    return { success: true, events: await fetchSiteLinkedEvents(siteId.trim()) };
  } catch (err) {
    console.error("getEventsBySiteAction error:", err);
    return { success: false, error: "No se pudieron obtener los eventos." };
  }
}
