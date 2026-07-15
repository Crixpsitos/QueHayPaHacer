import { Events } from "../events/Events";

export interface EventInteractions {
  id: string;
  eventId: string;
  /** "event" (default) = interacción con el evento; "session" = con una sesión concreta. */
  type?: "event" | "session";
  /** Presente cuando type === "session". */
  sessionId?: string;

  liked?: boolean;
  likedAt?: Date;

  viewedAt?: Date;
  clickCount?: number;

  registeredAt?: Date;

  share?: number;
  sharedAt?: Date;

  event: Events;

  createdAt: Date;
  updatedAt: Date;
}
