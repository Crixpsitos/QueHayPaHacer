import { createServerContainer } from "@/infraestructure/di/container";
import { cacheLife, cacheTag } from "next/cache";
import { UserPreferencesViewModelMapper } from "../mapper/UserPreferencesViewModelMapper";
import { UserPreferencesViewModel } from "../view-models/UserPreferencesViewModel";
import type { Events } from "@/domain/entities/events/Events";

export async function getUserPreferences(userId?: string): Promise<UserPreferencesViewModel | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(`user-preferences-${userId}`);

  if (!userId) return null;

  const { userPreferencesService } = createServerContainer();
  const preferences = await userPreferencesService.getPreferences(userId);

  if (!preferences) return null;

  return UserPreferencesViewModelMapper.toViewModel(preferences);
}

export async function getPreferenceEventIds(preferences: UserPreferencesViewModel): Promise<string[]> {
  "use cache";
  cacheTag(`preference-events-${preferences.userId}`);
  cacheLife("hours");

  const topCategoryIds = Object.entries(preferences.categories)
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, 3)
    .map(([categoryId]) => categoryId);

  if (topCategoryIds.length === 0) return [];

  const { eventFeed } = createServerContainer();
  return await eventFeed.getByUserPreferences(topCategoryIds);
}

export async function fetchPreferenceEventDetail(id: string): Promise<Events | null> {
  "use cache";
  cacheLife("weeks");
  cacheTag(`event-${id}`);
  const { eventsService } = createServerContainer();
  return await eventsService.getEventById(id);
}
