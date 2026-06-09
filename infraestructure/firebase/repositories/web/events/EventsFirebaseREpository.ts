import { doc, type Firestore, onSnapshot } from "firebase/firestore";
import { IEventsFirebaseRepository } from "./IEventsFirebaseRepository";
import { FirebaseEventsDto } from "@/infraestructure/firebase/dto/events/FirebaseEventsDto";

export class EventsFirebaseRepository implements IEventsFirebaseRepository {

    constructor(private readonly db: Firestore) {}
    findByIdOnSnapshot(id: string, callback: (data: FirebaseEventsDto | null) => void): () => void {
       const docRef = doc(this.db, "events", id);

    return onSnapshot(docRef, (snapshot) => {
        if (!snapshot.exists()) {
            callback(null);
            return;
        }
        
        callback({
            id: snapshot.id,
            ...snapshot.data()
        } as FirebaseEventsDto);
    }, (error) => {
        console.error("Error en el listener remoto:", error);
        callback(null);
    });
}
}