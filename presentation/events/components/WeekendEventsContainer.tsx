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
      likedByEventId={likedByEventId}
      info={{ title: "No hay eventos esta semana", description: "Revisa la agenda completa o busca un sitio para salir.", action: { href: "/eventos", label: "Ver todos los eventos" } }}
      variant="vertical"
    />
  );
};

