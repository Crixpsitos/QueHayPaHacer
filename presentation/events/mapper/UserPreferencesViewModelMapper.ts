import { UserPreferences } from '@/domain/entities/UserPreferences/UserPreferences';
import { UserPreferencesViewModel } from '../view-models/UserPreferencesViewModel';

export class UserPreferencesViewModelMapper {
  static toViewModel(preferences: UserPreferences): UserPreferencesViewModel {
    return {
      userId: preferences.userId,
      categories: this.mapCategoryScores(preferences.categories),
      updatedAt: preferences.updatedAt.toISOString(),
    };
  }

  private static mapCategoryScores(
    categories: Record<string, { score: number; interactionCount: number; slug: string; title: string; lastInteractionAt: Date }>
  ) {
    const mapped: Record<string, { score: number; interactionCount: number; slug: string; title: string; lastInteractionAt: string }> = {};

    for (const [categoryId, score] of Object.entries(categories)) {
      mapped[categoryId] = {
        score: score.score,
        interactionCount: score.interactionCount,
        slug: score.slug,
        title: score.title,
        lastInteractionAt: score.lastInteractionAt.toISOString(),
      };
    }

    return mapped;
  }
}
