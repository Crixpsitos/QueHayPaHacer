import { Suspense } from "react";
import Image from "next/image";
import { Award, Briefcase, CalendarDays, CheckCircle2, ExternalLink, Store } from "lucide-react";
import { ProfileAvatar } from "./ProfileAvatar";
import { PublicProfileStats } from "./PublicProfileStats";
import { ShareProfileButton } from "./ShareProfileButton";
import { MotionFadeIn } from "./MotionFadeIn";
import { ProfessionalDetailsCard } from "./ProfessionalDetailsCard";
import { ProfileBanner } from "./ProfileBanner";
import { PROFESSIONAL_TYPE_LABEL } from "../lib/professionalType";
import type { PublicProfileViewModel } from "../view-models/PublicProfileViewModel";
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel";

interface ProfileStatsShape {
  eventsCount: number;
  sitesCount: number;
  badgesCount: number;
}

interface PublicProfileHeaderProps {
  profile: PublicProfileViewModel;
  statsPromise: Promise<ProfileStatsShape>;
  publishedSite?: SiteDetail | null;
}

const formatMemberSince = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(new Date(iso));

/** Tarjeta pública del site publicado de un negocio — visible para visitantes */
function PublicBusinessSiteCard({ site }: { site: SiteDetail }) {
  const href = `/donde-ir/${site.slug}`;
  const description = site.description?.trim() || "Visita el sitio oficial de este negocio.";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Sitio oficial: ${site.name}`}
      className="group block overflow-hidden rounded-2xl border border-primary/20 bg-primary/[0.03] transition-all hover:border-primary/30 hover:bg-primary/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Banda de estado */}
      <div className="flex items-center gap-1.5 bg-primary/8 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary/70">
        <Store className="size-3" aria-hidden />
        Sitio oficial
      </div>

      {/* Cuerpo */}
      <div className="flex items-stretch">
        {/* Thumbnail */}
        <div className="relative w-24 shrink-0 self-stretch">
          {site.coverUrl ? (
            <div className="relative h-full w-full overflow-hidden">
              <Image
                src={site.coverUrl}
                alt={`Portada de ${site.name}`}
                fill
                sizes="192px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/10" aria-hidden />
            </div>
          ) : (
            <div className="flex h-full min-h-[72px] w-full items-center justify-center bg-primary/8" aria-hidden>
              <Store className="size-8 text-primary/50" />
            </div>
          )}
        </div>

        {/* Texto */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-4 py-3.5">
          <p className="line-clamp-1 text-sm font-bold text-foreground">{site.name}</p>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
          <span className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-white transition-colors group-hover:bg-primary/90">
            Visitar sitio
            <ExternalLink className="size-2.5" aria-hidden />
          </span>
        </div>
      </div>
    </a>
  );
}

export function PublicProfileHeader({ profile, statsPromise, publishedSite }: PublicProfileHeaderProps) {
  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || profile.username;

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

            <div className="min-w-0 flex-1 pt-12 sm:pt-14">
              <div className="space-y-3">
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
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                          <Award className="h-3.5 w-3.5" />
                          Organizador
                        </span>
                      )}
                      {profile.professionalType === "business" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                          <Briefcase className="h-3.5 w-3.5" />
                          Negocio
                        </span>
                      )}
                      {profile.professionalType === "government" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                          <Award className="h-3.5 w-3.5" />
                          Entidad Gov
                        </span>
                      )}
                      {!profile.professionalType && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange/15 px-2.5 py-0.5 text-xs font-semibold text-brand-orange">
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

                {profile.bio && <p className="max-w-lg text-sm text-muted-foreground">{profile.bio}</p>}

                <div className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                  <span>Miembro desde {formatMemberSince(profile.memberSince)}</span>
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

          {publishedSite && profile.professionalType === "business" && (
            <PublicBusinessSiteCard site={publishedSite} />
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
