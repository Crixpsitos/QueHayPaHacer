import { IUserPreferencesRepository } from '@/domain/repository/UserPreferences/IUserPreferencesRepository';
import { UserPreferences, CategoryScore } from '@/domain/entities/UserPreferences/UserPreferences';

export class UserPreferencesService {
  constructor(private preferencesRepository: IUserPreferencesRepository) {}

  async getPreferences(userId: string): Promise<UserPreferences | null> {
    return this.preferencesRepository.findByUserId(userId);
  }

  async getTopCategories(userId: string, limit: number = 5): Promise<Array<{ categoryId: string; score: CategoryScore }>> {
    const preferences = await this.preferencesRepository.findByUserId(userId);

    if (!preferences) {
      return [];
    }

    return Object.entries(preferences.categories)
      .map(([categoryId, score]) => ({
        categoryId,
        score,
      }))
      .sort((a, b) => b.score.score - a.score.score)
      .slice(0, limit);
  }

  async getCategoryPreference(userId: string, categoryId: string): Promise<CategoryScore | null> {
    const preferences = await this.preferencesRepository.findByUserId(userId);

    if (!preferences || !preferences.categories[categoryId]) {
      return null;
    }

    return preferences.categories[categoryId];
  }
}
