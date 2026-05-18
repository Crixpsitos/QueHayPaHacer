import { FirebaseEventsDto } from "../../dto/events/FirebaseEventsDto";

export interface IEventsFirebaseRepository {
    findFeaturedEvents(): Promise<FirebaseEventsDto[]>;
    findWeekendEvents(): Promise<FirebaseEventsDto[]>;
    findAllEvents(): Promise<FirebaseEventsDto[]>;
    findByTopCategory(categoryIds: string[]): Promise<FirebaseEventsDto[]>;
    findById(id: string): Promise<FirebaseEventsDto | null>;
    incrementLikes(eventId: string, delta: number): Promise<void>;
    incrementShares(eventId: string, delta: number): Promise<void>;
}