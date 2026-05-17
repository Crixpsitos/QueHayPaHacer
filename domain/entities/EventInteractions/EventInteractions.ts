import { Events } from "../events/Events";

export interface EventInteractions {
  id: string;
  eventId: string;

  liked: boolean;
  likedAt: Date;

  viewedAt: Date;
  clickCount: number;

  registeredAt: Date;

  event: Events;

  createdAt: Date;
  updatedAt: Date;
}
