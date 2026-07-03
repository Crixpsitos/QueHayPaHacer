"use client";

import { useAuth } from "@/app/store/auth/AuthContext";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ProfileAvatar } from "./ProfileAvatar";
import { AlertCircle, Award, Briefcase, CheckCircle2, Loader2, Mail, Phone } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useProfileConfigStore } from "@/app/store/profile/profileConfig.store";
import { ProfileStats } from "./ProfileStats";
import { RecentBadgesPanel } from "./RecentBadgesPanel";
import { ProfessionalDetailsCard } from "./ProfessionalDetailsCard";
import { createClientContainer } from "@/infraestructure/di/container.client";
import type { UserBadge } from "@/domain/repository/profile/IProfileRepository";
import { PROFESSIONAL_TYPE_LABEL, isProfessionalType } from "../lib/professionalType";

const { authService } = createClientContainer();

interface ProfileHeaderProps {
  statsPromise: (uid: string) => Promise<{ eventsCount: number; sitesCount: number; badgesCount: number }>;
  badgesPromise: (uid: string) => Promise<UserBadge[]>;
}

export const ProfileHeader = ({ statsPromise, badgesPromise }: ProfileHeaderProps) => {
  const { user, isHydrating } = useAuth();
  const [statsPromiseResolved, setStatsPromiseResolved] = useState<Promise<{ eventsCount: number; sitesCount: number; badgesCount: number }> | null>(null);
  const [badgesPromiseResolved, setBadgesPromiseResolved] = useState<Promise<UserBadge[]> | null>(null);
  const statsPromiseRef = useRef(statsPromise);
  const badgesPromiseRef = useRef(badgesPromise);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isProfessional = useMemo(() => user?.customClaims?.role === "professional", [user]);
  const professionalType = useMemo(() => {
    const value = user?.customClaims?.professionalType;
    return isProfessionalType(value) ? value : undefined;
  }, [user]);
  const professionalTypeLabel = professionalType ? PROFESSIONAL_TYPE_LABEL[professionalType] : "Profesional";
  const isVerified = useMemo(() => user?.emailVerified ?? false, [user]);
  const missingPhone = !user?.phoneNumber && !user?.profile?.phoneNumber;
  const missingBio = !user?.profile?.bio?.trim();
  const showProfileCompletionHint = missingPhone || missingBio;

  const { onOpenSettings, onSelectSectionSetting } = useProfileConfigStore();

  useEffect(() => {
    statsPromiseRef.current = statsPromise;
  }, [statsPromise]);

  useEffect(() => {
    badgesPromiseRef.current = badgesPromise;
  }, [badgesPromise]);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    setStatsPromiseResolved(statsPromiseRef.current(user.uid));
    setBadgesPromiseResolved(badgesPromiseRef.current(user.uid));
  }, [user?.uid]);

  const openProfileSectionSetting = () => {
    onSelectSectionSetting("edit-profile");
    onOpenSettings(true);
  };

  const handleSendEmailVerification = async () => {
    setIsVerifying(true);
    try {
      await authService.sendEmailVerification();
      setVerificationMessage({
        type: "success",
        message: "Email de verificación enviado. Revisa tu bandeja de entrada.",
      });
    } catch {
      setVerificationMessage({
        type: "error",
        message: "Error al enviar el email de verificación",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (isHydrating) {
    return <ProfileHeaderSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-6 sm:gap-8">
            <div className="relative shrink-0">
              <ProfileAvatar
                src={user?.photoURL}
                alt={`${user?.displayName ?? "Usuario"} avatar`}
                name={user?.displayName}
                sizes="(max-width: 640px) 80px, 128px"
                loading="eager"
                className={`h-20 w-20 sm:h-32 sm:w-32 ${
                  isProfessional
                    ? "ring-2 ring-brand-violet ring-offset-2 ring-offset-background"
                    : "border border-border"
                }`}
                textClassName="text-2xl sm:text-4xl"
              />
              {isVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-background p-0.5">
                  <CheckCircle2 className="size-6 fill-emerald-500 text-white sm:size-7" strokeWidth={2.5} />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_230px]">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {isProfessional ? (
                      <span className="text-xl font-bold tracking-tight sm:text-2xl">
                        <span className="text-brand-violet">@</span>
                        {user?.profile?.username ?? user?.displayName ?? "usuario"}
                      </span>
                    ) : (
                      <span className="text-xl font-bold tracking-tight sm:text-2xl">
                        {user?.profile?.firstName ?? user?.displayName ?? "Usuario"} {user?.profile?.lastName ?? ""}
                      </span>
                    )}

                    {isProfessional && (
                      <>
                        {professionalType === "organizer" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                            <Award className="h-3.5 w-3.5" />
                            Organizador
                          </span>
                        )}
                        {professionalType === "business" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            <Briefcase className="h-3.5 w-3.5" />
                            {professionalTypeLabel}
                          </span>
                        )}
                        {professionalType === "government" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            <Award className="h-3.5 w-3.5" />
                            {professionalTypeLabel}
                          </span>
                        )}
                        {!professionalType && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange/15 px-3 py-1 text-xs font-semibold text-brand-orange">
                            <Briefcase className="h-3.5 w-3.5" />
                            Profesional
                          </span>
                        )}
                      </>
                    )}

                    {showProfileCompletionHint && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-900/40 dark:text-amber-300">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Completa tu perfil
                      </span>
                    )}
                  </div>

                  {user?.profile?.bio && <p className="text-sm text-muted-foreground">{user.profile.bio}</p>}

                  <div className="grid gap-2 sm:grid-cols-2">
                    {user?.email && (
                      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{user.email}</span>
                      </div>
                    )}

                    {(user?.phoneNumber || user?.profile?.phoneNumber) && (
                      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{user.phoneNumber ?? user.profile?.phoneNumber}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openProfileSectionSetting}
                    className="border-brand-violet text-brand-violet hover:bg-brand-violet/10"
                  >
                    Editar Perfil
                  </Button>
                </div>

                <div className="overflow-hidden rounded-2xl border border-brand-violet/20 bg-linear-to-br from-brand-violet/10 via-background to-brand-orange/10 p-3.5 sm:p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-violet/15">
                        <Award className="h-4 w-4 text-brand-violet" />
                      </span>
                      Últimas insignias
                    </div>
                    <span className="rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      Logros
                    </span>
                  </div>
                  <RecentBadgesPanel badgesPromise={badgesPromiseResolved} />
                </div>
              </div>
            </div>
          </div>

          {statsPromiseResolved && (
            <div className="border-t border-border pt-4">
              <Suspense fallback={<StatsSkeleton />}>
                <ProfileStats statsPromise={statsPromiseResolved} />
              </Suspense>
            </div>
          )}

          {isProfessional && user?.profile && (
            <ProfessionalDetailsCard
              details={user.profile.professionalDetails}
              professionalType={professionalType ?? null}
              brandName={user.profile.brandName}
              website={user.profile.website}
              mapsLink={user.profile.mapsLink}
              socialLink={user.profile.socialLink}
            />
          )}
        </div>
      </div>

      {!isVerified && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-200">
                Aún no hemos verificado tu correo electrónico
              </h3>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                Verifícalo para poder empezar a subir los eventos en la plataforma.
              </p>
              <Button
                size="sm"
                onClick={handleSendEmailVerification}
                disabled={isVerifying}
                className="mt-3 bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-700"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Verificar correo electrónico
                  </>
                )}
              </Button>
              {verificationMessage && (
                <p
                  className={`mt-2 text-xs font-medium ${
                    verificationMessage.type === "success"
                      ? "text-green-700 dark:text-green-300"
                      : "text-red-700 dark:text-red-300"
                  }`}
                >
                  {verificationMessage.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function StatsSkeleton() {
  return (
    <div className="flex items-center gap-6 sm:gap-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div className="h-4 w-6 animate-pulse rounded bg-muted" />
          <div className="h-3 w-10 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function ProfileHeaderSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-start gap-6 sm:gap-8">
          <div className="h-20 w-20 animate-pulse rounded-full bg-muted sm:h-32 sm:w-32" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-56 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full max-w-md animate-pulse rounded bg-muted" />
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="h-9 w-full animate-pulse rounded bg-muted" />
              <div className="h-9 w-full animate-pulse rounded bg-muted" />
            </div>
            <div className="h-9 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="mt-6 border-t border-border pt-4">
          <StatsSkeleton />
        </div>
      </div>
    </div>
  );
}
