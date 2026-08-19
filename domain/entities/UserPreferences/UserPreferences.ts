export interface CategoryScore {
  score: number;
  interactionCount: number;
  slug: string;
  title: string;
  lastInteractionAt: Date;
}

export interface UserPreferences {
  userId: string;
  categories: Record<string, CategoryScore>; // clave = categoryId
  updatedAt: Date;
}
