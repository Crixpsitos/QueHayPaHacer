import type { FirebaseContactDto } from "../../dto/contact/FirebaseContactDto";

export interface IContactFirebaseRepository {
  create(contact: Omit<FirebaseContactDto, "id" | "createdAt">): Promise<FirebaseContactDto>;
}
