/**
 * ViewModel de UserPreferences para la capa de presentación.
 * Todas las fechas se representan como string ISO 8601.
 */
export interface CategoryScoreViewModel {
  score: number;
  interactionCount: number;
  slug: string;
  title: string;
  lastInteractionAt: string; // ISO 8601
}

export interface UserPreferencesViewModel {
  userId: string;
  categories: Record<string, CategoryScoreViewModel>; // clave = categoryId
  updatedAt: string; // ISO 8601
}
