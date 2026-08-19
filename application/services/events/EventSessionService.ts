import type { IEventSessionRepository } from "@/domain/repository/events/IEventSessionRepository";
import type { EventSession } from "@/domain/entities/events/EventSession";
import { toSlug } from "@/app/lib/utils/slug";

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
    const slug = data.slug || (await this.buildUniqueSlug(data.eventId, data.title));
    const session = await this.repo.create({ ...data, slug });
    return { session, hasOverlap: false };
  }

  /** Slug único DENTRO del evento, derivado del título. Añade sufijo -2, -3… si choca. */
  private async buildUniqueSlug(
    eventId: string,
    title: string | undefined,
    excludeSessionId?: string,
  ): Promise<string> {
    const base = toSlug(title ?? "") || "sesion";
    const existing = await this.repo.getByEventId(eventId);
    const taken = new Set(
      existing
        .filter((s) => s.id !== excludeSessionId)
        .map((s) => s.slug)
        .filter((s): s is string => !!s),
    );
    if (!taken.has(base)) return base;
    let i = 2;
    while (taken.has(`${base}-${i}`)) i++;
    return `${base}-${i}`;
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

    // Mientras la sesión es borrador, regenerar el slug cuando cambia el título
    let updateData: typeof data = data;
    if (data.title && data.status === "draft" && !data.slug) {
      const newSlug = await this.buildUniqueSlug(eventId, data.title, sessionId);
      updateData = { ...data, slug: newSlug };
    }

    const session = await this.repo.update(eventId, sessionId, updateData);
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
