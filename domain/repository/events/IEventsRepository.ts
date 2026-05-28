import { Events } from "@/domain/entities/events/Events";
import { IBaseRepository } from "../IBaseRepository";

export interface IEventsRepository extends IBaseRepository<Events>{ 
    findFeaturedEvents(): Promise<Events[]>;
    findWeekendEvents(): Promise<Events[]>;
    findByTopCategory(categoryIds: string[]): Promise<Events[]>;
    findLastDraftEventToUser(userId: string): Promise<Events | null>;
    findDraftEventByIdAndUser(id: string, userId: string): Promise<Events | null>;
    createDraftEvent(event: Events): Promise<Events>;
    updateEvent(event: Events): Promise<void>;

    incrementLikes(eventId: string, delta: number): Promise<void>;    
    incrementShares(eventId: string, delta: number): Promise<void>;    
}