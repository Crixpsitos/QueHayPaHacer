import { Events } from "@/domain/entities/events/Events";
import { IEventsRepository } from "@/domain/repository/events/IEventsRepository";
import { IStorageService } from "@/domain/services/storage/IStorageService";
import { countSiteEvents } from "@/domain/entities/sites/siteEventCount";

export class EventsService {
  private static readonly PREMIUM_AUTHOR_SCORE_BOOST = 10;

  constructor(private readonly eventsRepository: IEventsRepository, private readonly storageService: IStorageService) {}

  async createDraftEvent(event: Partial<Events>): Promise<Events> {
    const newEvent = await this.eventsRepository.createDraftEvent(event as Events);
    return newEvent;
  }

  async publishEvent(event: Partial<Events>, options?: { isPremiumAuthor?: boolean }): Promise<Events> {
    if(!event.id) {
      const boost = options?.isPremiumAuthor ? EventsService.PREMIUM_AUTHOR_SCORE_BOOST : 0;
      const eventWithScore: Events = {
        ...event,
        analytics: {
          ...event.analytics,
          score: (event.analytics?.score ?? 0) + boost,
        },
      } as Events;

      const newEvent = await this.eventsRepository.createEvent(eventWithScore);
      return newEvent;
    }

    await this.eventsRepository.updateEvent(event as Events);
    return event as Events;
  }

  async updateEvent(event: Partial<Events>): Promise<void> {
    await this.eventsRepository.updateEvent(event as Events);
  }

  async applyModerationDecision(
    eventId: string,
    decision: "approved" | "rejected",
    reviewer: string,
    reason?: string,
  ): Promise<{ event: Events; wasPrePublication: boolean }> {
    const event = await this.eventsRepository.findById(eventId);
    if (!event) throw new Error("Event not found");
    if (event.moderationStatus !== "pending" && event.moderationStatus !== "pending_audit") {
      throw new Error("Event is not awaiting moderation");
    }
    if (decision === "rejected" && !reason?.trim()) {
      throw new Error("A rejection reason is required");
    }

    const reviewedAt = new Date();
    const wasPrePublication = event.moderationMode === "pre_publication";
    const moderatedEvent: Events = {
      ...event,
      status: decision === "approved" ? "published" : "rejected",
      moderationStatus: decision,
      rejectionReason: decision === "rejected" ? reason!.trim() : null,
      reviewedAt,
      reviewedBy: reviewer,
      publishedAt: decision === "approved" ? (event.publishedAt ?? reviewedAt) : event.publishedAt,
      updatedAt: reviewedAt,
    };

    await this.eventsRepository.updateEvent(moderatedEvent);
    return { event: moderatedEvent, wasPrePublication };
  }
  async deleteEvent(id: string): Promise<void> {
    await this.eventsRepository.deleteEvent(id);
  }

  /** Sincroniza el rango de fechas del evento (multi-date) con sus sesiones:
   *  startDate = inicio más temprano, endDate = fin más tardío. Sin esto, las
   *  consultas de listado (filtran por endDate/startDate) excluyen el evento. */
  async syncDateRangeFromSessions(
    eventId: string,
    sessions: { startDate: Date | string; endDate: Date | string; status: string }[],
  ): Promise<void> {
    // Excluye canceladas; si no queda ninguna, no toca las fechas existentes.
    const source = sessions.filter((s) => s.status !== "cancelled");
    if (source.length === 0) return;

    const start = new Date(
      Math.min(...source.map((s) => new Date(s.startDate).getTime())),
    );
    const end = new Date(
      Math.max(...source.map((s) => new Date(s.endDate).getTime())),
    );
    await this.eventsRepository.updateEventDateRange(eventId, start, end);
  }

  async startDraftEvent(
  user: { id: string; displayName: string; photoURL: string; }
) {

  const existingDraft =
    await this.findLastDraftEventToUser(
      user.id
    );

  if (existingDraft) {
    return {
      hasDraft: true,
      draft: existingDraft,
    };
  }

  const eventId =
    await this.createDraftEvent({
      author: {
        id: user.id,
        displayName: user.displayName,
        photoURL: user.photoURL,
      },
      status: "draft",
    });

  return {
    hasDraft: false,
    eventId,
  };
}

  async findDraftEventByIdAndUser(id: string, userId: string): Promise<Events | null> {
    return this.eventsRepository.findDraftEventByIdAndUser(id, userId);
  }

  async findLastDraftEventToUser(userId: string): Promise<Events | null> {
    return this.eventsRepository.findLastDraftEventToUser(userId);
  }


  async getFeaturedEvents(): Promise<string[]> {
    return this.eventsRepository.findFeaturedEvents();
  }

  async getWeekendEvents(): Promise<string[]> {
    return this.eventsRepository.findWeekendEvents();
  }

  async getEventById(id: string): Promise<Events | null> {
    return this.eventsRepository.findById(id);
  }

  async getEventBySlug(slug: string): Promise<Events | null> {
    return this.eventsRepository.findBySlug(slug);
  }

  /** Para el sitemap: eventos publicados y vigentes. */
  getSitemapEntries(limit = 1000) {
    return this.eventsRepository.findSitemapEntries(limit);
  }

  async getAllEvents(): Promise<string[]> {
    return this.eventsRepository.findAllPublished();
  }

  async incrementLikes(eventId: string, delta: number): Promise<void> {
    await this.eventsRepository.incrementLikes(eventId, delta);
  }

  async getEventsByUserPreferences(topCategory: string[]): Promise<string[]> {
    return this.eventsRepository.findByTopCategory(topCategory);
  }

  /** Página por cursor de una categoría (por docId). Devuelve IDs + nextCursor. */
  async getEventsByCategoryPaginated(categoryId: string, categorySlug: string | null, limit: number, cursor: string | null) {
    return this.eventsRepository.findByCategoryPaginated(categoryId, categorySlug, limit, cursor);
  }

  /** Página por cursor de "Todos los eventos". Devuelve IDs + nextCursor. */
  async getAllEventsPaginated(limit: number, cursor: string | null) {
    return this.eventsRepository.findAllPaginated(limit, cursor);
  }

  /** Escribe `siteIds` y devuelve los que tenía antes (para recontar también los sitios que dejó de tener). */
  async syncSiteIds(eventId: string, siteIds: string[]): Promise<string[]> {
    return this.eventsRepository.updateSiteIds(eventId, siteIds);
  }

  /**
   * Cuántos eventos publicados y recientes tiene un sitio (ver siteEventCount). Reutiliza `findPublishedBySiteId`
   * (consulta ya indexada) y filtra en memoria.
   * ponytail: tope de 300 eventos por sitio; si un sitio llegara a tenerlos, el conteo queda en el tope.
   */
  async countRecentBySiteId(siteId: string, now: Date = new Date()): Promise<number> {
    const all = await this.eventsRepository.findPublishedBySiteId(siteId, 300);
    return countSiteEvents(all, now);
  }

  /** Eventos publicados vinculados a un sitio — solo vigentes (endDate >= hoy), próximos primero. */
  async getEventsBySiteId(siteId: string, limit = 8) {
    const now = new Date();
    // Traer más para compensar los expirados que se filtran en memoria
    const all = await this.eventsRepository.findPublishedBySiteId(siteId, limit + 20);
    return all
      .filter((e) => !e.endDate || e.endDate >= now)
      .sort((a, b) => (a.startDate?.getTime() ?? 0) - (b.startDate?.getTime() ?? 0))
      .slice(0, limit);
  }

}