import type { EventViewModel } from "./EventViewModel";

export interface EventDetailsViewModel {
  event: EventViewModel;
  interaction?: {
    id: string;
    eventId: string;
    liked: boolean;
    likedAt: string;
    viewedAt: string;
    clickCount: number;
    createdAt: string;
    updatedAt: string;
  };
}
