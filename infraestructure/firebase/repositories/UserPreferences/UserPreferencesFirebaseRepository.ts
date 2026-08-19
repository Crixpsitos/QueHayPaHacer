import { FirebaseUserPreferencesDto } from "@/infraestructure/firebase/dto/UserPreferences/FirebaseUserPreferencesDto";
import { IUserPreferencesFirebaseRepository } from "./IUserPreferencesFirebaseRepository";
import { FirebaseBaseRepository } from "../FirebaseBaseRepository";
import { Firestore } from "firebase-admin/firestore";

export class UserPreferencesFirebaseRepository
  extends FirebaseBaseRepository
  implements IUserPreferencesFirebaseRepository
{
  protected readonly collectionName = "users";
  constructor(db: Firestore) {
    super(db);
  }

  async createOrUpdate(
    userId: string,
    preferences: FirebaseUserPreferencesDto,
  ): Promise<void> {
    try {
      const preferencesRef = this.subCollection(userId, "preferences").doc(
        "categories",
      );

      await preferencesRef.set(preferences, { merge: true });
    } catch (error) {
      console.error("Error updating user preferences:", error);
      throw error;
    }
  }
  async findByUserId(
    userId: string,
  ): Promise<FirebaseUserPreferencesDto | null> {
    try {
      const preferencesRef = this.subCollection(userId, "preferences").doc(
        "categories",
      );

      const snapshot = await preferencesRef.get();

      if (!snapshot.exists) {
        return null;
      }

      const data = snapshot.data() as FirebaseUserPreferencesDto;
      return data;
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      throw error;
    }
  }
}
