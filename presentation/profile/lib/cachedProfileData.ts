import { cacheLife, cacheTag } from "next/cache";
import { createServerContainer } from "@/infraestructure/di/container";
import type { User } from "@/domain/entities/user/User";
import { normalizeHandle } from "./normalizeHandle";
import { resolvePublicUser } from "./resolvePublicUser";
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

/**
 * Usuario público por @handle (o uid). Lo comparten generateMetadata y la página: antes eran 2-4 lecturas de
 * Firestore por visita. Se invalida con `user-profile-<uid>` (editar perfil/visibilidad/avatar/banner/moderación)
 * y con `profile-handle-<handle>` (cambio de username libera/ocupa el handle).
 */
export function getCachedPublicUser(rawHandle: string): Promise<User | null> {
  return cachedPublicUser(normalizeHandle(rawHandle));
}

async function cachedPublicUser(handle: string): Promise<User | null> {
  "use cache";
  cacheTag(`profile-handle-${handle}`);
  const user = await resolvePublicUser(handle);
  if (!user) {
    // ponytail: un handle inexistente no se cachea más de ~1 min (alguien puede registrarlo).
    cacheLife("seconds");
    return null;
  }
  cacheTag(`user-profile-${user.uid}`);
  cacheLife("hours");
  return user;
}
