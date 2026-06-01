import { FirebaseEventsDto } from "../../dto/events/FirebaseEventsDto";

export interface IEventsFirebaseRepository {
    findFeaturedEvents(): Promise<FirebaseEventsDto[]>;
    findWeekendEvents(): Promise<FirebaseEventsDto[]>;
    findAllEvents(): Promise<FirebaseEventsDto[]>;
    findByTopCategory(categoryIds: string[]): Promise<FirebaseEventsDto[]>;
    findLastDraftEventToUser(userId: string): Promise<FirebaseEventsDto | null>;
    findDraftEventByIdAndUser(id: string, userId: string): Promise<FirebaseEventsDto | null>;
    createDraftEvent(event: FirebaseEventsDto): Promise<FirebaseEventsDto>;
    updateEvent(event: FirebaseEventsDto): Promise<void>;
    findById(id: string): Promise<FirebaseEventsDto | null>;
    incrementLikes(eventId: string, delta: number): Promise<void>;
    incrementShares(eventId: string, delta: number): Promise<void>;
    createEvent(event: FirebaseEventsDto): Promise<FirebaseEventsDto>;
}