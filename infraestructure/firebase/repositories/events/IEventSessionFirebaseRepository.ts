import type { EventSession } from "@/domain/entities/events/EventSession";
import type { FirebaseEventSessionDto } from "../../dto/events/FirebaseEventSessionDto";

/**
 * Puerto de infraestructura: las lecturas devuelven DTOs crudos de Firestore.
 * El mapeo DTO → dominio vive en `EventSessionAdapter`. El repo conserva el
 * mapper solo para el lado de escritura (`toDto`), acoplado a la generación
 * del ref y los serverTimestamp.
 */
export interface IEventSessionFirebaseRepository {
  getByEventId(eventId: string): Promise<FirebaseEventSessionDto[]>;

  getById(eventId: string, sessionId: string): Promise<FirebaseEventSessionDto | null>;

  create(
    session: Omit<EventSession, "id" | "createdAt" | "updatedAt">,
  ): Promise<FirebaseEventSessionDto>;

  update(
    eventId: string,
    sessionId: string,
    data: Partial<Omit<EventSession, "id" | "eventId" | "createdAt">>,
  ): Promise<FirebaseEventSessionDto>;

  delete(eventId: string, sessionId: string): Promise<void>;

  incrementCounter(
    eventId: string,
    sessionId: string,
    field: "views" | "registrations" | "shares",
    delta: number,
  ): Promise<void>;

  hasOverlap(
    eventId: string,
    startDate: Date,
    endDate: Date,
    excludeSessionId?: string,
  ): Promise<boolean>;
}
