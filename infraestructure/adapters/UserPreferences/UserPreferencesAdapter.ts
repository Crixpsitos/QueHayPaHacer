import { IUserPreferencesRepository } from '@/domain/repository/UserPreferences/IUserPreferencesRepository';
import { UserPreferences } from '@/domain/entities/UserPreferences/UserPreferences';
import { UserPreferencesFirebaseRepository } from '@/infraestructure/firebase/repositories/UserPreferences/UserPreferencesFirebaseRepository';
import { UserPreferencesFirebaseMapper } from '@/infraestructure/firebase/mappers/UserPreferences/UserPreferencesFirebaseMapper';

export class UserPreferencesAdapter implements IUserPreferencesRepository {
  private firebaseRepository: UserPreferencesFirebaseRepository;
  private mapper: UserPreferencesFirebaseMapper;


  constructor() {
    this.firebaseRepository = new UserPreferencesFirebaseRepository();
    this.mapper = new UserPreferencesFirebaseMapper();
  }

  async findByUserId(userId: string): Promise<UserPreferences | null> {
    const dto = await this.firebaseRepository.findByUserId(userId);

    if (!dto) {
      return null;
    }

    return this.mapper.toDomain(dto);
  }
}
