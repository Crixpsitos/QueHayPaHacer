import { Suspense } from "react";
import { Award, Briefcase, CalendarDays, CheckCircle2 } from "lucide-react";
import { ProfileAvatar } from "./ProfileAvatar";
import { PublicProfileStats } from "./PublicProfileStats";
import { RecentBadgesPanel } from "./RecentBadgesPanel";
import { ShareProfileButton } from "./ShareProfileButton";
import { MotionFadeIn } from "./MotionFadeIn";
import { ProfessionalDetailsCard } from "./ProfessionalDetailsCard";
import { PROFESSIONAL_TYPE_LABEL } from "../lib/professionalType";
import type { PublicProfileViewModel } from "../view-models/PublicProfileViewModel";
import type { UserBadge } from "@/domain/repository/profile/IProfileRepository";

interface ProfileStatsShape {
  eventsCount: number;
  sitesCount: number;
  badgesCount: number;
}

interface PublicProfileHeaderProps {
  profile: PublicProfileViewModel;
  statsPromise: Promise<ProfileStatsShape>;
  badgesPromise: Promise<UserBadge[]>;
}

const formatMemberSince = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(new Date(iso));

export function PublicProfileHeader({ profile, statsPromise, badgesPromise }: PublicProfileHeaderProps) {
  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || profile.username;

  return (
    <MotionFadeIn className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div
          className={`relative h-20 sm:h-28 ${
            profile.isProfessional
              ? "bg-linear-to-r from-brand-violet/25 via-brand-orange/15 to-brand-violet/25"
              : "bg-linear-to-r from-muted via-muted/60 to-muted"
          }`}
        >
          <div className="absolute right-3 top-3">
            <ShareProfileButton username={profile.username} variant="icon" />
          </div>
        </div>

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
                  profile.isProfessional
                    ? "ring-4 ring-brand-violet/80 ring-offset-2 ring-offset-background"
                    : "border-4 border-background ring-1 ring-border"
                }`}
                textClassName="text-2xl sm:text-4xl"
              />
              {profile.emailVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-background p-0.5">
                  <CheckCircle2 className="size-6 fill-emerald-500 text-white sm:size-7" strokeWidth={2.5} />
                </div>
              )}
            </div>

            <div className="flex-1 pt-12 sm:pt-14">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_230px]">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {profile.isProfessional ? (
                      <span className="text-xl font-bold tracking-tight sm:text-2xl">
                        <span className="text-brand-violet">@</span>
                        {profile.username}
                      </span>
                    ) : (
                      <span className="text-xl font-bold tracking-tight sm:text-2xl">{fullName}</span>
                    )}

                    {profile.isProfessional && (
                      <>
                        {profile.professionalType === "organizer" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                            <Award className="h-3.5 w-3.5" />
                            Organizador
                          </span>
                        )}
                        {profile.professionalType === "business" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            <Briefcase className="h-3.5 w-3.5" />
                            Negocio
                          </span>
                        )}
                        {profile.professionalType === "government" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            <Award className="h-3.5 w-3.5" />
                            Entidad Gov
                          </span>
                        )}
                        {!profile.professionalType && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange/15 px-3 py-1 text-xs font-semibold text-brand-orange">
                            <Briefcase className="h-3.5 w-3.5" />
                            Profesional
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {profile.isProfessional && (
                    <p className="text-sm font-medium text-foreground/80">{fullName}</p>
                  )}

                  {profile.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}

                  <div className="flex w-fit items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Miembro desde {formatMemberSince(profile.memberSince)}
                    </span>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-brand-violet/20 bg-linear-to-br from-brand-violet/10 via-background to-brand-orange/10 p-3.5 sm:p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-violet/15">
                        <Award className="h-4 w-4 text-brand-violet" />
                      </span>
                      Insignias
                    </div>
                    <span className="rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      Logros
                    </span>
                  </div>
                  <RecentBadgesPanel badgesPromise={badgesPromise} emptyMessage="Aún no tiene insignias." />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <Suspense fallback={<StatsSkeleton />}>
              <PublicProfileStats statsPromise={statsPromise} />
            </Suspense>
          </div>

          {profile.isProfessional && (
            <ProfessionalDetailsCard
              details={profile.professionalDetails}
              professionalType={profile.professionalType}
              brandName={profile.brandName}
              website={profile.website}
              mapsLink={profile.mapsLink}
              socialLink={profile.socialLink}
            />
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
