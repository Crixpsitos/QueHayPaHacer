import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { FirebaseBaseRepository } from "../FirebaseBaseRepository";
import type { IContactFirebaseRepository } from "./IContactFirebaseRepository";
import type { FirebaseContactDto } from "../../dto/contact/FirebaseContactDto";

export class ContactFirebaseRepository
  extends FirebaseBaseRepository
  implements IContactFirebaseRepository
{
  protected readonly collectionName = "contactos";

  constructor(db: Firestore) {
    super(db);
  }

  async create(
    contact: Omit<FirebaseContactDto, "id" | "createdAt">,
  ): Promise<FirebaseContactDto> {
    const ref = this.collection.doc();
    const now = FieldValue.serverTimestamp();
    const data: FirebaseContactDto = { ...contact, id: ref.id, createdAt: now };
    await ref.set(data);
    return data;
  }
}
