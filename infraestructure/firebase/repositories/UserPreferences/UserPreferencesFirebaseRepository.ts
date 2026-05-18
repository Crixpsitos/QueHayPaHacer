import { getFirebaseFirestore } from '@/infraestructure/firebase/config/admin/firebase';
import { IUserPreferencesRepository } from '@/domain/repository/UserPreferences/IUserPreferencesRepository';
import { FirebaseUserPreferencesDto } from '@/infraestructure/firebase/dto/UserPreferences/FirebaseUserPreferencesDto';
import { IUserPreferencesFirebaseRepository } from './IUserPreferencesFirebaseRepository';

export class UserPreferencesFirebaseRepository implements IUserPreferencesFirebaseRepository {
  async findByUserId(userId: string): Promise<FirebaseUserPreferencesDto | null> {
    try {
      const db = getFirebaseFirestore();
      const preferencesRef = db
        .collection('users')
        .doc(userId)
        .collection('preferences')
        .doc('categories');

      const snapshot = await preferencesRef.get();

      if (!snapshot.exists) {
        return null;
      }

      const data = snapshot.data() as FirebaseUserPreferencesDto;
      return data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      throw error;
    }
  }
}
