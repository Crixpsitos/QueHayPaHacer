"use client";

import { memo } from "react";
import { useAuth } from "@/app/store/auth/AuthContext";
import { ProfileTabs } from "./ProfileTabs";
import { fetchUserEvents, fetchUserSites, fetchUserLikes, fetchUserBadges } from "@/app/lib/api/profile-fetcher";

function ProfileTabsWrapperInner() {
  const { user } = useAuth();

  if (!user?.uid) {
    return null;
  }

  const isProfessional = user.customClaims?.role === "professional";

  return (
    <ProfileTabs
      uid={user.uid}
      fetchUserEvents={fetchUserEvents}
      fetchUserSites={fetchUserSites}
      fetchUserLikes={fetchUserLikes}
      fetchUserBadges={fetchUserBadges}
      canEdit
      showStudioLink={isProfessional}
    />
  );
}

// Memoizar para evitar re-renders innecesarios
export const ProfileTabsWrapper = memo(ProfileTabsWrapperInner);
