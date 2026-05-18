import { Timestamp } from 'firebase-admin/firestore';
import { UserPreferences, CategoryScore } from '@/domain/entities/UserPreferences/UserPreferences';
import { FirebaseUserPreferencesDto, FirebaseCategoryScore } from '@/infraestructure/firebase/dto/UserPreferences/FirebaseUserPreferencesDto';
import { IUserPreferencesMapper } from './IUserPreferencesMapper';

export class UserPreferencesFirebaseMapper implements IUserPreferencesMapper {
  toDomain(dto: FirebaseUserPreferencesDto): UserPreferences {
    return {
      userId: dto.userId,
      categories: this.mapCategoryScores(dto.categories),
      updatedAt: dto.updatedAt.toDate(),
    };
  }

    toDto(domain: UserPreferences): FirebaseUserPreferencesDto {
    return {
      userId: domain.userId,
      categories: this.mapCategoryScoresToFirebase(domain.categories),
      updatedAt: Timestamp.fromDate(domain.updatedAt),
    };
  }

  private mapCategoryScores(
    firebaseCategories: Record<string, FirebaseCategoryScore>
  ): Record<string, CategoryScore> {
    const mapped: Record<string, CategoryScore> = {};

    for (const [categoryId, score] of Object.entries(firebaseCategories)) {
      mapped[categoryId] = {
        score: score.score,
        interactionCount: score.interactionCount,
        slug: score.slug,
        title: score.title,
        lastInteractionAt: score.lastInteractionAt.toDate(),
      };
    }

    return mapped;
  }

  private mapCategoryScoresToFirebase(
    categories: Record<string, CategoryScore>
  ): Record<string, FirebaseCategoryScore> {
    const mapped: Record<string, FirebaseCategoryScore> = {};

    for (const [categoryId, score] of Object.entries(categories)) {
      mapped[categoryId] = {
        score: score.score,
        interactionCount: score.interactionCount,
        slug: score.slug,
        title: score.title,
        lastInteractionAt: Timestamp.fromDate(score.lastInteractionAt),
      };
    }

    return mapped;
  }
}
