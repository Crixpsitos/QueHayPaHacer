"use client";

import { fetchUserEvents, fetchUserSites, fetchUserBadges } from "@/app/lib/api/profile-fetcher";
import { PublicProfileTabs } from "./PublicProfileTabs";

interface PublicProfileTabsWrapperProps {
  uid: string;
}

export function PublicProfileTabsWrapper({ uid }: PublicProfileTabsWrapperProps) {
  return (
    <PublicProfileTabs
      uid={uid}
      fetchUserEvents={fetchUserEvents}
      fetchUserSites={fetchUserSites}
      fetchUserBadges={fetchUserBadges}
    />
  );
}
