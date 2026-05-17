import { Events } from "@/domain/entities/events/Events";
import { IBaseRepository } from "../IBaseRepository";

export interface IEventsRepository extends IBaseRepository<Events>{ 
    findFeaturedEvents(): Promise<Events[]>;
    findWeekendEvents(): Promise<Events[]>;
    incrementLikes(eventId: string, delta: number): Promise<void>;
    
}