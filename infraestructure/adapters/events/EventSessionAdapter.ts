import type { IEventSessionRepository } from "@/domain/repository/events/IEventSessionRepository";
import type { EventSession } from "@/domain/entities/events/EventSession";
import type { IEventSessionFirebaseRepository } from "@/infraestructure/firebase/repositories/events/IEventSessionFirebaseRepository";
import type { EventSessionFirebaseMapper } from "@/infraestructure/firebase/mappers/events/EventSessionFirebaseMapper";

/** Puerto de dominio: envuelve el repo Firebase y mapea DTO → dominio en las lecturas. */
export class EventSessionAdapter implements IEventSessionRepository {
  constructor(
    private readonly repository: IEventSessionFirebaseRepository,
    private readonly mapper: EventSessionFirebaseMapper,
  ) {}

  async getByEventId(eventId: string): Promise<EventSession[]> {
    const dtos = await this.repository.getByEventId(eventId);
    return dtos.map((dto) => this.mapper.toDomain(dto));
  }

  async getById(eventId: string, sessionId: string): Promise<EventSession | null> {
    const dto = await this.repository.getById(eventId, sessionId);
    return dto ? this.mapper.toDomain(dto) : null;
  }

  async create(
    session: Omit<EventSession, "id" | "createdAt" | "updatedAt">,
  ): Promise<EventSession> {
    const dto = await this.repository.create(session);
    return this.mapper.toDomain(dto);
  }

  async update(
    eventId: string,
    sessionId: string,
    data: Partial<Omit<EventSession, "id" | "eventId" | "createdAt">>,
  ): Promise<EventSession> {
    const dto = await this.repository.update(eventId, sessionId, data);
    return this.mapper.toDomain(dto);
  }

  delete(eventId: string, sessionId: string): Promise<void> {
    return this.repository.delete(eventId, sessionId);
  }

  incrementCounter(
    eventId: string,
    sessionId: string,
    field: "views" | "registrations" | "shares",
    delta: number,
  ): Promise<void> {
    return this.repository.incrementCounter(eventId, sessionId, field, delta);
  }

  hasOverlap(
    eventId: string,
    startDate: Date,
    endDate: Date,
    excludeSessionId?: string,
  ): Promise<boolean> {
    return this.repository.hasOverlap(eventId, startDate, endDate, excludeSessionId);
  }
}
