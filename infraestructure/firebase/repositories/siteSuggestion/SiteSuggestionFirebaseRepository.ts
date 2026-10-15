import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { FirebaseBaseRepository } from "../FirebaseBaseRepository";
import type { ISiteSuggestionRepository } from "@/domain/repository/siteSuggestion/ISiteSuggestionRepository";
import type { SiteSuggestion } from "@/domain/entities/siteSuggestion/SiteSuggestion";

// ponytail: sin adapter/mapper; solo Admin SDK (las reglas niegan todo acceso de cliente).
export class SiteSuggestionFirebaseRepository extends FirebaseBaseRepository implements ISiteSuggestionRepository {
  protected readonly collectionName = "siteSuggestions";

  constructor(db: Firestore) {
    super(db);
  }

  async pendingByAuthor(uid: string) {
    // Dos igualdades: sin índice compuesto.
    const snap = await this.collection.where("authorUid", "==", uid).where("status", "==", "pending").get();
    return snap.docs.map((d) => ({ siteId: d.get("siteId") as string, field: d.get("field") as string }));
  }

  async create(suggestion: SiteSuggestion): Promise<string> {
    const ref = await this.collection.add({ ...suggestion, createdAt: FieldValue.serverTimestamp() });
    return ref.id;
  }
}
