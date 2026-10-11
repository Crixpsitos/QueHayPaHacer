import { cacheLife, cacheTag } from "next/cache";
import { createServerContainer } from "@/infraestructure/di/container";
import type {
  ProfileStats,
  UserBadge,
  UserEvent,
  UserEventInteraction,
  UserSite,
} from "@/domain/repository/profile/IProfileRepository";

export async function getCachedProfileStats(uid: string): Promise<ProfileStats> {
  "use cache";
  cacheTag(`profile-stats-${uid}`);
  cacheLife("days");
  const { profileService } = createServerContainer();
  return profileService.getStats(uid);
}

export async function getCachedUserEvents(uid: string, limit?: number): Promise<UserEvent[]> {
  "use cache";
  cacheTag(`profile-events-${uid}`);
  cacheLife("days");
  const { profileService } = createServerContainer();
  return profileService.getUserEvents(uid, limit);
}

export async function getCachedUserSites(uid: string, limit?: number): Promise<UserSite[]> {
  "use cache";
  cacheTag(`profile-sites-${uid}`);
  cacheLife("days");
  const { profileService } = createServerContainer();
  return profileService.getUserSites(uid, limit);
}

export async function getCachedUserLikes(uid: string, limit?: number): Promise<UserEventInteraction[]> {
  "use cache";
  cacheTag(`profile-likes-${uid}`);
  cacheLife("days");
  const { profileService } = createServerContainer();
  return profileService.getUserEventInteractions(uid, limit);
}

export async function getCachedUserBadges(uid: string, limit?: number): Promise<UserBadge[]> {
  "use cache";
  cacheTag(`profile-badges-${uid}`);
  cacheLife("days");
  const { profileService } = createServerContainer();
  return profileService.getUserBadges(uid, limit);
}
