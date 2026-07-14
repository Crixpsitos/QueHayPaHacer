import type { IEventSessionRepository } from "@/domain/repository/events/IEventSessionRepository";
import type { EventSession } from "@/domain/entities/events/EventSession";

/** Mensaje único para el solapamiento de horarios (reutilizado en las actions). */
export const SESSION_OVERLAP_MESSAGE =
  "El horario de esta sesión se solapa con otra sesión del evento. Ajusta la fecha u hora.";

/** Se lanza cuando una sesión publicada colisionaría en horario con otra. */
export class SessionOverlapError extends Error {
  constructor() {
    super(SESSION_OVERLAP_MESSAGE);
    this.name = "SessionOverlapError";
  }
}

export class EventSessionService {
  constructor(private readonly repo: IEventSessionRepository) {}

  async getByEventId(eventId: string): Promise<EventSession[]> {
    return this.repo.getByEventId(eventId);
  }

  async getById(eventId: string, sessionId: string): Promise<EventSession | null> {
    return this.repo.getById(eventId, sessionId);
  }

  /** Solapa el rango [start, end) con otra sesión del evento (bordes que se tocan NO solapan). */
  async checkOverlap(
    eventId: string,
    startDate: Date,
    endDate: Date,
    excludeSessionId?: string,
  ): Promise<boolean> {
    return this.repo.hasOverlap(eventId, startDate, endDate, excludeSessionId);
  }

  /**
   * Crea una sesión. Bloquea (lanza SessionOverlapError) si el horario colisiona
   * con otra sesión del evento. Este path es de publicación, no de borrador.
   */
  async createSession(
    data: Omit<EventSession, "id" | "createdAt" | "updatedAt">,
  ): Promise<{ session: EventSession; hasOverlap: boolean }> {
    if (await this.repo.hasOverlap(data.eventId, data.startDate, data.endDate)) {
      throw new SessionOverlapError();
    }
    const session = await this.repo.create(data);
    return { session, hasOverlap: false };
  }

  /**
   * Actualiza una sesión. Si trae fechas, bloquea (lanza SessionOverlapError)
   * cuando colisiona con otra sesión. Sin fechas (p.ej. solo cambio de estado)
   * no verifica solapamiento.
   */
  async updateSession(
    eventId: string,
    sessionId: string,
    data: Partial<Omit<EventSession, "id" | "eventId" | "createdAt">>,
  ): Promise<{ session: EventSession; hasOverlap: boolean }> {
    if (data.startDate && data.endDate) {
      if (
        await this.repo.hasOverlap(
          eventId,
          data.startDate,
          data.endDate,
          sessionId,
        )
      ) {
        throw new SessionOverlapError();
      }
    }

    const session = await this.repo.update(eventId, sessionId, data);
    return { session, hasOverlap: false };
  }

  async deleteSession(eventId: string, sessionId: string): Promise<void> {
    return this.repo.delete(eventId, sessionId);
  }

  /**
   * Verifica si todas las sesiones del evento están listas para publicar:
   * - Al menos 1 sesión
   * - Ninguna sesión se solapa con otra
   */
  async validateForPublish(eventId: string): Promise<{ valid: boolean; errors: string[] }> {
    const sessions = await this.repo.getByEventId(eventId);
    const errors: string[] = [];

    if (sessions.length === 0) {
      errors.push("El evento debe tener al menos una sesión para publicarse.");
    }

    // Check all pairs for overlaps
    for (let i = 0; i < sessions.length; i++) {
      for (let j = i + 1; j < sessions.length; j++) {
        const a = sessions[i];
        const b = sessions[j];
        const overlaps = a.startDate < b.endDate && a.endDate > b.startDate;
        if (overlaps) {
          errors.push(
            `Las sesiones "${a.title ?? a.id}" y "${b.title ?? b.id}" tienen horarios que se solapan.`,
          );
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
