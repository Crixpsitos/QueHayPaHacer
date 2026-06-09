import { FirebaseEventsDto } from "../../../dto/events/FirebaseEventsDto";

export interface IEventsFirebaseRepository {
    findByIdOnSnapshot(id: string, callback: (data: FirebaseEventsDto | null) => void): () => void;
}