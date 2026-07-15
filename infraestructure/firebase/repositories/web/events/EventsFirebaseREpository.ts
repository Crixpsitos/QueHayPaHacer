import { doc, type DocumentData, type Firestore, onSnapshot } from "firebase/firestore";
import { IEventsFirebaseRepository } from "./IEventsFirebaseRepository";
import { FirebaseEventsDto } from "@/infraestructure/firebase/dto/events/FirebaseEventsDto";
import { subscribeWhenAuthed } from "@/infraestructure/firebase/config/client/firebase";

export class EventsFirebaseRepository implements IEventsFirebaseRepository {

    constructor(private readonly db: Firestore) {}

    /** Escucha una sesión (subcolección) para reflejar el estado de optimización de imágenes/media. */
    findSessionByIdOnSnapshot(
        eventId: string,
        sessionId: string,
        callback: (data: DocumentData | null) => void,
    ): () => void {
        const docRef = doc(this.db, "events", eventId, "sessions", sessionId);
        return subscribeWhenAuthed(() =>
            onSnapshot(
                docRef,
                (snapshot) => {
                    if (!snapshot.exists()) {
                        callback(null);
                        return;
                    }
                    callback({ id: snapshot.id, ...snapshot.data() });
                },
                (error) => {
                    console.error("Error en el listener de sesión:", error);
                    callback(null);
                },
            ),
        );
    }

    findByIdOnSnapshot(id: string, callback: (data: FirebaseEventsDto | null) => void): () => void {
       const docRef = doc(this.db, "events", id);

    return subscribeWhenAuthed(() =>
        onSnapshot(docRef, (snapshot) => {
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
        }),
    );
}
}