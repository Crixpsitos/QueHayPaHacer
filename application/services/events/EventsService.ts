import { Events } from "@/domain/entities/events/Events";
import { IEventsRepository } from "@/domain/repository/events/IEventsRepository";
import { IStorageService } from "@/domain/services/storage/IStorageService";

export class EventsService {
  private static readonly PROFESSIONAL_AUTHOR_SCORE_BOOST = 10;

  constructor(private readonly eventsRepository: IEventsRepository, private readonly storageService: IStorageService) {}

  async createDraftEvent(event: Partial<Events>): Promise<Events> {
    const newEvent = await this.eventsRepository.createDraftEvent(event as Events);
    return newEvent;
  }

  async publishEvent(event: Partial<Events>, options?: { isProfessionalAuthor?: boolean }): Promise<Events> {
    if(!event.id) {
      const boost = options?.isProfessionalAuthor ? EventsService.PROFESSIONAL_AUTHOR_SCORE_BOOST : 0;
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
  async getEventsByCategoryPaginated(categoryId: string, limit: number, cursor: string | null) {
    return this.eventsRepository.findByCategoryPaginated(categoryId, limit, cursor);
  }

}