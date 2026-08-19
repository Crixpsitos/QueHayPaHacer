import { Events } from "@/domain/entities/events/Events";
import { IEventsRepository } from "@/domain/repository/events/IEventsRepository";
import { IEventsMapper } from "@/infraestructure/firebase/mappers/events/IEventsMapper";
import { removeUndefinedProperties } from "@/infraestructure/firebase/mappers/shared/removeUndefinedProperties";
import { IEventsFirebaseRepository } from "@/infraestructure/firebase/repositories/events/IEventsFirebaseRepository";

export class EventsAdapter implements IEventsRepository {
  constructor(
    private readonly repository: IEventsFirebaseRepository,
    private readonly mapper: IEventsMapper,
  ) {}
  async createEvent(event: Events): Promise<Events> {
    const dto = this.mapper.toDto(event);
    const cleanDto = removeUndefinedProperties(dto);

    const firebaseDto = await this.repository.createEvent(cleanDto);
    return this.mapper.toDomain(firebaseDto);
  }
  async updateEvent(event: Events): Promise<void> {
    const dto = this.mapper.toDto(event);
    const cleanDto = removeUndefinedProperties(dto);

    await this.repository.updateEvent(cleanDto);
  }
  async updateEventDateRange(eventId: string, startDate: Date, endDate: Date): Promise<void> {
    await this.repository.updateEventDateRange(eventId, startDate, endDate);
  }
  async findLastDraftEventToUser(userId: string): Promise<Events | null> {
    const dto = await this.repository.findLastDraftEventToUser(userId);
    return dto ? this.mapper.toDomain(dto) : null
  }
  async findDraftEventByIdAndUser(id: string, userId: string): Promise<Events | null> {
    const dto = await this.repository.findDraftEventByIdAndUser(id, userId);
    return dto ? this.mapper.toDomain(dto) : null;
  }
  async createDraftEvent(event: Events): Promise<Events> {
    const dto = this.mapper.toDto(event);
    const cleanDto = removeUndefinedProperties(dto);

    const firebaseDto = await this.repository.createDraftEvent(cleanDto);
    return this.mapper.toDomain(firebaseDto);
  }

  async findFeaturedEvents(): Promise<string[]> {
    return await this.repository.findFeaturedEvents();
  }
  async findWeekendEvents(): Promise<string[]> {
    return await this.repository.findWeekendEvents();
  }
  async incrementLikes(eventId: string, delta: number): Promise<void> {
    await this.repository.incrementLikes(eventId, delta);
  }

  async incrementShares(eventId: string, delta: number): Promise<void> {
    await this.repository.incrementShares(eventId, delta);
  }

  async findPublishedBySiteId(siteId: string, limit = 8): Promise<Events[]> {
    const dtos = await this.repository.findPublishedBySiteId(siteId, limit);
    return dtos.map((d) => this.mapper.toDomain(d));
  }

  async updateSiteIds(eventId: string, siteIds: string[]): Promise<void> {
    await this.repository.updateSiteIds(eventId, siteIds);
  }
  async deleteEvent(id: string): Promise<void> {
    await this.repository.deleteEvent(id);
  }

  findById(id: string): Promise<Events | null> {
    return this.repository.findById(id).then(dto => dto ? this.mapper.toDomain(dto) : null);
  }

  findBySlug(slug: string): Promise<Events | null> {
    return this.repository.findBySlug(slug).then(dto => dto ? this.mapper.toDomain(dto) : null);
  }

  async findByTopCategory(categoryIds: string[]): Promise<string[]> {
    return await this.repository.findByTopCategory(categoryIds);
  }

  async findByCategoryPaginated(categoryId: string, categorySlug: string | null, limit: number, cursor: string | null) {
    return await this.repository.findByCategoryPaginated(categoryId, categorySlug, limit, cursor);
  }

  async findAll(): Promise<Events[]> {
    throw new Error("Use findAllPublished() to get published event IDs.");
  }

  async findAllPublished(): Promise<string[]> {
    return await this.repository.findAllEvents();
  }
  create(item: Events): Promise<Events> {
    void item;
    throw new Error("Method not implemented.");
  }
  update(id: string, item: Events): Promise<Events> {
    void id;
    void item;
    throw new Error("Method not implemented.");
  }
  delete(id: string): Promise<void> {
    void id;
    throw new Error("Method not implemented.");
  }
}
