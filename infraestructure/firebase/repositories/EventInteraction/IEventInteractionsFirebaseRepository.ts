import { FirebaseEventInteractionDto } from "../../dto/EventInteraction/FirebaseEventInteractionDto";

export interface IEventInteractionsFirebaseRepository {
    findByEventAndUser(eventId: string, userId: string): Promise<FirebaseEventInteractionDto | null>;
    createLikeInteraction(eventId: string, userId: string, liked: boolean): Promise<void>;
    createClickInteraction(eventId: string, userId: string): Promise<void>
    createRegistrationInteraction(eventId: string, userId: string): Promise<void>
}