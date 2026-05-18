import { Events } from "@/domain/entities/events/Events";
import { IEventsRepository } from "@/domain/repository/events/IEventsRepository";
import { IEventsMapper } from "@/infraestructure/firebase/mappers/events/IEventsMapper";
import { IEventsFirebaseRepository } from "@/infraestructure/firebase/repositories/events/IEventsFirebaseRepository";

export class EventsAdapter implements IEventsRepository {
  constructor(
    private readonly repository: IEventsFirebaseRepository,
    private readonly mapper: IEventsMapper,
  ) {}

  async findFeaturedEvents(): Promise<Events[]> {
    const dtos = await this.repository.findFeaturedEvents();
    return dtos.map(dto => this.mapper.toDomain(dto));
  }
  async findWeekendEvents(): Promise<Events[]> {
    const dtos = await this.repository.findWeekendEvents();
    return dtos.map(dto => this.mapper.toDomain(dto));
  }
  async incrementLikes(eventId: string, delta: number): Promise<void> {
    await this.repository.incrementLikes(eventId, delta);
  }

  async incrementShares(eventId: string, delta: number): Promise<void> {
    await this.repository.incrementShares(eventId, delta);
  }

  findById(id: string): Promise<Events | null> {
    return this.repository.findById(id).then(dto => dto ? this.mapper.toDomain(dto) : null);
  }

  async findByTopCategory(categoryIds: string[]): Promise<Events[]> {
    const dtos = await this.repository.findByTopCategory(categoryIds);
    return dtos.map(dto => this.mapper.toDomain(dto));
  }

  async findAll(): Promise<Events[]> {
    const dtos = await this.repository.findAllEvents();
    return dtos.map(dto => this.mapper.toDomain(dto));
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
