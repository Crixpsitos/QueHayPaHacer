import type { CollectionReference, DocumentData, Firestore } from "firebase-admin/firestore";

export abstract class FirebaseBaseRepository {
    protected abstract readonly collectionName: string;

    constructor(protected readonly db: Firestore) {}

    protected get collection(): CollectionReference<DocumentData> {
        return this.db.collection(this.collectionName);
    }
}