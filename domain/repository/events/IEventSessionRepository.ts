import type { EventSession } from "@/domain/entities/events/EventSession";

export interface IEventSessionRepository {
  /** Devuelve todas las sesiones de un evento, ordenadas por startDate ASC. */
  getByEventId(eventId: string): Promise<EventSession[]>;

  getById(eventId: string, sessionId: string): Promise<EventSession | null>;

  create(session: Omit<EventSession, "id" | "createdAt" | "updatedAt">): Promise<EventSession>;

  update(
    eventId: string,
    sessionId: string,
    data: Partial<Omit<EventSession, "id" | "eventId" | "createdAt">>,
  ): Promise<EventSession>;

  delete(eventId: string, sessionId: string): Promise<void>;

  /** Incrementa un contador de analytics de la sesión (like/view/registro). */
  incrementCounter(
    eventId: string,
    sessionId: string,
    field: "likes" | "views" | "registrations",
    delta: number,
  ): Promise<void>;

  /**
   * Comprueba si el rango [startDate, endDate] se solapa con alguna sesión
   * existente del evento. Excluye `excludeSessionId` para el caso de edición.
   *
   * Un solapamiento ocurre cuando la nueva sesión empieza antes de que
   * termine otra y termina después de que esa otra empieza.
   */
  hasOverlap(
    eventId: string,
    startDate: Date,
    endDate: Date,
    excludeSessionId?: string,
  ): Promise<boolean>;
}
