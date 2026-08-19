"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper";
import type { EventViewModel } from "@/presentation/events/view-models/EventViewModel";

type Result =
  | { success: true; events: EventViewModel[] }
  | { success: false; error: string };

export async function getEventsBySiteAction(siteId: string): Promise<Result> {
  if (!siteId?.trim()) return { success: false, error: "siteId requerido." };
  try {
    const { eventsService } = createServerContainer();
    const events = await eventsService.getEventsBySiteId(siteId, 8);
    return { success: true, events: events.map((e) => EventViewModelMapper.toViewModel(e)) };
  } catch (err) {
    console.error("getEventsBySiteAction error:", err);
    return { success: false, error: "No se pudieron obtener los eventos." };
  }
}
