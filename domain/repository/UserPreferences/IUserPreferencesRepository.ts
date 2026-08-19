import { UserPreferences } from '@/domain/entities/UserPreferences/UserPreferences';

export interface IUserPreferencesRepository {
  findByUserId(userId: string): Promise<UserPreferences | null>;
}
