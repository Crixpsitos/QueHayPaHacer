import type { DocumentData } from "firebase-admin/firestore";

/**
 * Documentos del perfil: Firestore laxo. El repo devuelve docs crudos y el
 * mapeo a read-models (`UserEvent`, `UserSite`, ...) vive en `ProfileFirebaseMapper`.
 */
export interface FirestoreDoc {
  id: string;
  data: DocumentData;
}

/** Interacciones del usuario + los docs de evento ya resueltos por id (join). */
export interface ProfileInteractionsRaw {
  interactions: FirestoreDoc[];
  eventsById: Record<string, DocumentData>;
}
