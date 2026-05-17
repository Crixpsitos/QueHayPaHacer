import { FirebaseEventsDto } from "../../dto/events/FirebaseEventsDto";

export interface IEventsFirebaseRepository {
    findFeaturedEvents(): Promise<FirebaseEventsDto[]>;
    findWeekendEvents(): Promise<FirebaseEventsDto[]>;
    incrementLikes(eventId: string, delta: number): Promise<void>;
}