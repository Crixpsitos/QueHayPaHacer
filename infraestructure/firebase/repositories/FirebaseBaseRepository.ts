import type { Firestore, CollectionReference, DocumentData } from "firebase-admin/firestore";

export abstract class FirebaseBaseRepository {
  protected readonly db: Firestore;

  protected abstract readonly collectionName: string;

  constructor(db: Firestore) {
    this.db = db;
  }

  protected get collection(): CollectionReference<DocumentData> {
    return this.db.collection(this.collectionName);
  }
}
