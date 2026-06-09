import { IUserPreferencesRepository } from '@/domain/repository/UserPreferences/IUserPreferencesRepository';
import { UserPreferences } from '@/domain/entities/UserPreferences/UserPreferences';
import { UserPreferencesFirebaseRepository } from '@/infraestructure/firebase/repositories/UserPreferences/UserPreferencesFirebaseRepository';
import { UserPreferencesFirebaseMapper } from '@/infraestructure/firebase/mappers/UserPreferences/UserPreferencesFirebaseMapper';

export class UserPreferencesAdapter implements IUserPreferencesRepository {

  constructor(private readonly repository: UserPreferencesFirebaseRepository, private readonly mapper: UserPreferencesFirebaseMapper) {}

  async findByUserId(userId: string): Promise<UserPreferences | null> {
    const dto = await this.repository.findByUserId(userId);

    if (!dto) {
      return null;
    }

    return this.mapper.toDomain(dto);
  }
}
