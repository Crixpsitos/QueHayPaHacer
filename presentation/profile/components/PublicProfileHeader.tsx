import { Suspense } from "react";
import { Award, BadgeCheck, CalendarDays, ExternalLink } from "lucide-react";
import { ProfileAvatar } from "./ProfileAvatar";
import { PublicProfileStats } from "./PublicProfileStats";
import { ShareProfileButton } from "./ShareProfileButton";
import { MotionFadeIn } from "./MotionFadeIn";
import { ProfileBanner } from "./ProfileBanner";
import type { PublicProfileViewModel } from "../view-models/PublicProfileViewModel";
import { normalizeExternalUrl } from "../lib/normalizeExternalUrl";

interface ProfileStatsShape {
  eventsCount: number;
  sitesCount: number;
  badgesCount: number;
}

interface PublicProfileHeaderProps {
  profile: PublicProfileViewModel;
  /** Ausente en perfiles privados: solo se muestran avatar, nombre y @username. */
  statsPromise?: Promise<ProfileStatsShape>;
}

const formatMemberSince = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "America/Bogota" }).format(new Date(iso));

export function PublicProfileHeader({ profile, statsPromise }: PublicProfileHeaderProps) {
  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || profile.username;
  const isCreator = profile.participation === "creator";
  const showDetails = profile.isPublic;
  const websiteHref = showDetails && profile.website ? normalizeExternalUrl(profile.website) : null;

  return (
    <MotionFadeIn className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <ProfileBanner bannerUrl={profile.bannerUrl}>
          <div className="absolute right-3 top-3">
            <ShareProfileButton username={profile.username} variant="icon" />
          </div>
        </ProfileBanner>

        <div className="-mt-12 flex flex-col gap-6 p-5 sm:-mt-14 sm:p-6">
          <div className="flex items-start gap-6 sm:gap-8">
            <div className="relative shrink-0">
              <ProfileAvatar
                src={profile.photoURL}
                alt={`${fullName} avatar`}
                name={fullName}
                sizes="(max-width: 640px) 80px, 128px"
                loading="eager"
                className={`h-20 w-20 bg-background sm:h-32 sm:w-32 ${
                  isCreator
                    ? "ring-4 ring-primary/80 ring-offset-2 ring-offset-background"
                    : "border-4 border-background ring-1 ring-border"
                }`}
                textClassName="text-2xl sm:text-4xl"
              />
              {profile.creatorVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-background p-0.5">
                  <BadgeCheck className="size-6 fill-primary text-white sm:size-7" strokeWidth={2.5} role="img" aria-label="Creador verificado por QHPA" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 pt-12 sm:pt-14">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{fullName}</h1>

                  {isCreator && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary">
                      <Award className="h-3.5 w-3.5" aria-hidden />
                      Creador
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">@{profile.username}</p>

                {showDetails && profile.bio && (
                  <div className="max-w-lg border-l-2 border-primary/60 pl-4">
                    <p className="text-sm leading-7 text-foreground/80">{profile.bio}</p>
                  </div>
                )}

                {showDetails && (
                  <div className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                    <span>Miembro desde {formatMemberSince(profile.memberSince)}</span>
                  </div>
                )}

                {websiteHref && (
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Sitio web
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                )}
              </div>
            </div>
          </div>

          {showDetails && statsPromise && (
            <div className="border-t border-border pt-4">
              <Suspense fallback={<StatsSkeleton />}>
                <PublicProfileStats statsPromise={statsPromise} />
              </Suspense>
            </div>
          )}

        </div>
      </div>
    </MotionFadeIn>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center justify-center gap-2 rounded-xl bg-muted/40 py-3">
          <div className="h-4 w-4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
