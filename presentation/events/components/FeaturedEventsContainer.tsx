import { EventCardInteractive } from "./card/EventCardInteractive";
import { EventViewModelMapper } from "../mapper/EventViewModelMapper";
import type { Events } from "@/domain/entities/events/Events";

interface FeaturedEventsContainerProps {
  featuredEvents: Events[];
  likedByEventId?: Record<string, boolean>;
}

export const FeaturedEventsContainer = ({ featuredEvents, likedByEventId = {} }: FeaturedEventsContainerProps) => {
  const featuredEventsViewModels = featuredEvents.map((event) =>
    EventViewModelMapper.toViewModel(event),
  );

  return (
    <EventCardInteractive
      events={featuredEventsViewModels}
      likedByEventId={likedByEventId}
      info={{ title: "Lamentablemente no hay eventos destacados :C", description: "Estamos trabajando constantemente para traerte las mejores experiencias. ¡Vuelve pronto para descubrir lo que tenemos preparado para ti!" }}
      variant="vertical"
    />
  );
};
