import { EventCardInteractive } from "./card/EventCardInteractive";
import { FeaturedEventCard } from "./card/FeaturedEventCard";
import { EventViewModelMapper } from "../mapper/EventViewModelMapper";
import type { Events } from "@/domain/entities/events/Events";

interface FeaturedEventsContainerProps {
  featuredEvents: Events[];
  likedByEventId?: Record<string, boolean>;
}

export const FeaturedEventsContainer = ({ featuredEvents, likedByEventId = {} }: FeaturedEventsContainerProps) => {
  const viewModels = featuredEvents.map((event) =>
    EventViewModelMapper.toViewModel(event),
  );

  if (viewModels.length === 0) return null;

  const [first, ...rest] = viewModels;

  return (
    <div className="space-y-4">
      {/* Primer evento: card destacada a ancho completo */}
      <FeaturedEventCard
        event={first}
        initialLiked={likedByEventId[first.id] ?? false}
        prioritizeImage
      />
      {/* Hasta 3 eventos más en grid */}
      {rest.length > 0 && (
        <EventCardInteractive
          events={rest.slice(0, 3)}
          likedByEventId={likedByEventId}
          info={{ title: "Sin eventos destacados", description: "Vuelve pronto." }}
          variant="vertical"
          columns={3}
        />
      )}
    </div>
  );
};
