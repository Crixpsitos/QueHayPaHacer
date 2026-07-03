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
  cacheLife("hours");
  const { profileService } = createServerContainer();
  return profileService.getStats(uid);
}

export async function getCachedUserEvents(uid: string): Promise<UserEvent[]> {
  "use cache";
  cacheTag(`profile-events-${uid}`);
  cacheLife("hours");
  const { profileService } = createServerContainer();
  return profileService.getUserEvents(uid);
}

export async function getCachedUserSites(uid: string): Promise<UserSite[]> {
  "use cache";
  cacheTag(`profile-sites-${uid}`);
  cacheLife("hours");
  const { profileService } = createServerContainer();
  return profileService.getUserSites(uid);
}

export async function getCachedUserLikes(uid: string): Promise<UserEventInteraction[]> {
  "use cache";
  cacheTag(`profile-likes-${uid}`);
  cacheLife("hours");
  const { profileService } = createServerContainer();
  return profileService.getUserEventInteractions(uid);
}

export async function getCachedUserBadges(uid: string): Promise<UserBadge[]> {
  "use cache";
  cacheTag(`profile-badges-${uid}`);
  cacheLife("hours");
  const { profileService } = createServerContainer();
  return profileService.getUserBadges(uid);
}
