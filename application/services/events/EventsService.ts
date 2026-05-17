import { Events } from "@/domain/entities/events/Events";
import { IEventsRepository } from "@/domain/repository/events/IEventsRepository";

export class EventsService {

  constructor(private readonly eventsRepository: IEventsRepository) {}

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

}