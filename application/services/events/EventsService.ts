import { Events } from "@/domain/entities/events/Events";
import { IEventsRepository } from "@/domain/repository/events/IEventsRepository";
import { IStorageService } from "@/domain/services/storage/IStorageService";

export class EventsService {

  constructor(private readonly eventsRepository: IEventsRepository, private readonly storageService: IStorageService) {}

  async createDraftEvent(event: Partial<Events>): Promise<Events> {
    const newEvent = await this.eventsRepository.createDraftEvent(event as Events);
    return newEvent;
  }

  async publishEvent(event: Partial<Events>): Promise<Events> {
    if(!event.id) {
      const newEvent = await this.eventsRepository.createEvent(event as Events);
      return newEvent;
    } 

    await this.eventsRepository.updateEvent(event as Events);
    return event as Events;
  }

  async updateEvent(event: Partial<Events>): Promise<void> {
    await this.eventsRepository.updateEvent(event as Events);
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


  async getFeaturedEvents(): Promise<Events[]> {
    return this.eventsRepository.findFeaturedEvents();
  }

  async getWeekendEvents(): Promise<Events[]> {
    return this.eventsRepository.findWeekendEvents();
  }

  async getEventById(id: string): Promise<Events | null> {
    return this.eventsRepository.findById(id);
  }

  async getAllEvents(): Promise<Events[]> {
    return this.eventsRepository.findAll();
  }

  async incrementLikes(eventId: string, delta: number): Promise<void> {
    await this.eventsRepository.incrementLikes(eventId, delta);
  }

  async getEventsByUserPreferences(topCategory: string[]): Promise<Events[]> {
    return this.eventsRepository.findByTopCategory(topCategory);
  }

}