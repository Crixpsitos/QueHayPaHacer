"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/store/auth/AuthContext";
import { ProfileTabs } from "./ProfileTabs";
import { fetchMyProfileData, type MyProfileData } from "@/app/lib/api/profile-fetcher";

function ProfileTabsWrapperInner() {
  const { user } = useAuth();
  const [data, setData] = useState<MyProfileData | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    fetchMyProfileData().then(setData).catch(console.error);
  }, [user?.uid]);

  // Callbacks estables: se recrean solo cuando cambia `data` (una vez)
  const fetchEvents = useCallback((_uid: string) => Promise.resolve(data?.events ?? []), [data]);
  const fetchSites  = useCallback((_uid: string) => Promise.resolve(data?.sites  ?? []), [data]);
  const fetchLikes  = useCallback((_uid: string) => Promise.resolve(data?.likes  ?? []), [data]);
  const fetchBadges = useCallback((_uid: string) => Promise.resolve(data?.badges ?? []), [data]);

  if (!user?.uid) return null;

  const isProfessional = user.customClaims?.role === "professional";

  return (
    <ProfileTabs
      uid={user.uid}
      fetchUserEvents={fetchEvents}
      fetchUserSites={fetchSites}
      fetchUserLikes={fetchLikes}
      fetchUserBadges={fetchBadges}
      canEdit
      showStudioLink={isProfessional}
    />
  );
}

// Memoizar para evitar re-renders innecesarios
export const ProfileTabsWrapper = memo(ProfileTabsWrapperInner);
