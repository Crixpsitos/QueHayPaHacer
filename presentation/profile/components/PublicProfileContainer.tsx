import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Container } from "@/app/components/layout/shared/Container";
import { getCachedProfileStats, getCachedPublicUser } from "../lib/cachedProfileData";
import { PublicProfileViewModelMapper } from "../mapper/PublicProfileViewModelMapper";
import { PublicProfileHeader } from "./PublicProfileHeader";
import { OwnerRedirect } from "./OwnerRedirect";
import { PublicProfileTabsData, PublicProfileTabsSkeleton } from "./PublicProfileTabsData";
import { PrivateProfileNotice } from "./PrivateProfileNotice";

interface PublicProfileContainerProps {
  handle: string;
}

export const PublicProfileContainer = async ({ handle }: PublicProfileContainerProps) => {
  const resolvedUser = await getCachedPublicUser(handle);

  if (!resolvedUser) {
    return notFound();
  }

  const profile = PublicProfileViewModelMapper.toViewModel(resolvedUser);

  return (
    <Container aria-label="Public profile page" className="flex flex-1 flex-col gap-6 p-4">
      <OwnerRedirect uid={resolvedUser.uid} />
      <div className="space-y-6">
        <PublicProfileHeader
          profile={profile}
          statsPromise={profile.isPublic ? getCachedProfileStats(resolvedUser.uid) : undefined}
        />
      </div>
      {profile.isPublic ? (
        <Suspense fallback={<PublicProfileTabsSkeleton />}>
          <PublicProfileTabsData uid={resolvedUser.uid} />
        </Suspense>
      ) : (
        <PrivateProfileNotice profile={profile} />
      )}
    </Container>
  );
};
