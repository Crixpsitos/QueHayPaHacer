/**
 * Funciones de fetch para el perfil
 * Usa fetch API puro en lugar de server actions
 */

import type {
  UserBadge,
  UserEvent,
  UserEventInteraction,
  UserSite,
} from "@/domain/repository/profile/IProfileRepository";

interface ProfileStatsResponse {
  eventsCount: number;
  followersCount: number;
  followingCount: number;
  likesCount: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export async function fetchUserStats(uid: string): Promise<ProfileStatsResponse> {
  const response = await fetch(`${API_BASE}/api/profile/stats?uid=${uid}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user stats: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchUserEvents(uid: string): Promise<UserEvent[]> {
  const response = await fetch(`${API_BASE}/api/profile/events?uid=${uid}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user events: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchUserSites(uid: string): Promise<UserSite[]> {
  const response = await fetch(`${API_BASE}/api/profile/sites?uid=${uid}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user sites: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchUserLikes(uid: string): Promise<UserEventInteraction[]> {
  const response = await fetch(`${API_BASE}/api/profile/likes?uid=${uid}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user likes: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchUserBadges(uid: string): Promise<UserBadge[]> {
  const response = await fetch(`${API_BASE}/api/profile/badges?uid=${uid}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user badges: ${response.statusText}`);
  }

  return response.json();
}
