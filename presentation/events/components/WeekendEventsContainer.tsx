import { EventCardInteractive } from "./card/EventCardInteractive";
import { EventViewModelMapper } from "../mapper/EventViewModelMapper";
import type { Events } from "@/domain/entities/events/Events";

interface WeekendEventsContainerProps {
  weekendEvents: Events[];
  likedByEventId?: Record<string, boolean>;
}

export const WeekendEventsContainer = ({ weekendEvents, likedByEventId = {} }: WeekendEventsContainerProps) => {
  const weekendEventsViewModels = weekendEvents.map((event) =>
    EventViewModelMapper.toViewModel(event),
  );

  return (
    <EventCardInteractive
      events={weekendEventsViewModels}
      attendeeCount={weekendEventsViewModels.reduce(
        (total, event) => total + (event.analytics?.registrations || 0),
        0,
      )}
      likedByEventId={likedByEventId}
      info={{ title: "Lamentablemente no hay eventos para esta semana :C", description: "Estamos trabajando constantemente para traerte las mejores experiencias. ¡Vuelve pronto para descubrir lo que tenemos preparado para ti!" }}
      variant="vertical"
    />
  );
};

