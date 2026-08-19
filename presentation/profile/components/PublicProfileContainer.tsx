import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { Container } from "@/app/components/layout/shared/Container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getCachedProfileStats, getCachedUserBadges } from "../lib/cachedProfileData";
import { resolvePublicUser } from "../lib/resolvePublicUser";
import { PublicProfileViewModelMapper } from "../mapper/PublicProfileViewModelMapper";
import { PublicProfileHeader } from "./PublicProfileHeader";
import { PublicProfileTabsWrapper } from "./PublicProfileTabsWrapper";
import { PrivateProfileNotice } from "./PrivateProfileNotice";
import { createServerContainer } from "@/infraestructure/di/container";
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel";

interface PublicProfileContainerProps {
  handle: string;
}

/** Obtiene el primer site publicado y aprobado de un usuario, para mostrar en el perfil público. */
async function fetchPublishedSite(uid: string): Promise<SiteDetail | null> {
  const { sitesService } = createServerContainer();
  const sites = await sitesService.getMySites(uid);
  return (
    sites.find(
      (s) => s.publicationStatus === "published" && s.moderationStatus === "approved",
    ) ?? null
  );
}

export const PublicProfileContainer = async ({ handle }: PublicProfileContainerProps) => {
  const resolvedUser = await resolvePublicUser(handle);

  if (!resolvedUser) {
    return notFound();
  }

  const tokens = await getTokens(await cookies(), authConfig);
  if (tokens?.decodedToken?.uid === resolvedUser.uid) {
    redirect("/profile");
  }

  const profile = PublicProfileViewModelMapper.toViewModel(resolvedUser);

  const publishedSite =
    profile.professionalType === "business"
      ? await fetchPublishedSite(resolvedUser.uid)
      : null;

  return (
    <Container aria-label="Public profile page" className="flex flex-1 flex-col gap-6 p-4">
      <div className="space-y-6">
        <PublicProfileHeader
          profile={profile}
          statsPromise={getCachedProfileStats(resolvedUser.uid)}
          publishedSite={publishedSite}
        />
      </div>
      {profile.isPublic ? (
        <PublicProfileTabsWrapper uid={resolvedUser.uid} />
      ) : (
        <PrivateProfileNotice profile={profile} />
      )}
    </Container>
  );
};
