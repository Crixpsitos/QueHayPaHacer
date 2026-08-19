import type { EventInteractions } from "@/domain/entities/EventInteractions/EventInteractions";
import type { Events } from "@/domain/entities/events/Events";
import type { EventDetailsViewModel } from "../view-models/EventDetailsViewModel";
import { EventViewModelMapper } from "./EventViewModelMapper";

export class EventDetailsViewModelMapper {
  static toViewModel(params: {
    event: Events;
    interaction?: EventInteractions | null;
  }): EventDetailsViewModel {
    const { event, interaction } = params;

    return {
      event: EventViewModelMapper.toViewModel(event),
      interaction: interaction
        ? {
            id: interaction.id,
            eventId: interaction.eventId,
            liked: interaction.liked,
            likedAt: interaction.likedAt?.toISOString(),
            viewedAt: interaction.viewedAt?.toISOString(),
            clickCount: interaction.clickCount,
            createdAt: interaction.createdAt.toISOString(),
            updatedAt: interaction.updatedAt.toISOString(),
          }
        : undefined,
    };
  }
}
