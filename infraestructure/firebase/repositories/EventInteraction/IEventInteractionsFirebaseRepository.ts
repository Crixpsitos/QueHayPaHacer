import { FirebaseEventInteractionDto, type DenormalizedEventFirebaseData } from "../../dto/EventInteraction/FirebaseEventInteractionDto";

export interface IEventInteractionsFirebaseRepository {
    findByEventAndUser(eventId: string, userId: string): Promise<FirebaseEventInteractionDto | null>;
    createLikeInteraction(eventId: string, userId: string, liked: boolean, eventData: DenormalizedEventFirebaseData): Promise<void>;
    createClickInteraction(eventId: string, userId: string, eventData: DenormalizedEventFirebaseData): Promise<void>
    createRegistrationInteraction(eventId: string, userId: string, eventData: DenormalizedEventFirebaseData): Promise<void>
    createShareInteraction(eventId: string, userId: string, eventData: DenormalizedEventFirebaseData): Promise<void>;
}