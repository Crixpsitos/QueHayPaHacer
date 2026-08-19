import { FirebaseUserPreferencesDto } from "../../dto/UserPreferences/FirebaseUserPreferencesDto";

export interface IUserPreferencesFirebaseRepository {
    findByUserId(userId: string): Promise<FirebaseUserPreferencesDto | null>;
}