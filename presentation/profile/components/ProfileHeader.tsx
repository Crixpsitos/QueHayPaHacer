"use client";

import { Suspense, use, useEffect, useRef, useState } from "react";
import { AlertCircle, Award, BadgeCheck, ExternalLink, Loader2, Mail } from "lucide-react";
import { useAuth } from "@/app/store/auth/AuthContext";
import { Button } from "@/app/components/ui/button";
import { useProfileConfigStore } from "@/app/store/profile/profileConfig.store";
import { createClientContainer } from "@/infraestructure/di/container.client";
import type { UserBadge } from "@/domain/repository/profile/IProfileRepository";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileStats } from "./ProfileStats";
import { ShareProfileButton } from "./ShareProfileButton";
import { ProfileBanner } from "./ProfileBanner";

const { authService } = createClientContainer();

interface ProfileHeaderProps {
  statsPromise: (uid: string) => Promise<{
    eventsCount: number;
    sitesCount: number;
    badgesCount: number;
  }>;
  badgesPromise: (uid: string) => Promise<UserBadge[]>;
}

export const ProfileHeader = ({ statsPromise, badgesPromise }: ProfileHeaderProps) => {
  const { user, isHydrating } = useAuth();
  const { onOpenSettings, onSelectSectionSetting } = useProfileConfigStore();
  const statsPromiseRef = useRef(statsPromise);
  const badgesPromiseRef = useRef(badgesPromise);
  const [resolvedStats, setResolvedStats] = useState<ReturnType<typeof statsPromise> | null>(null);
  const [resolvedBadges, setResolvedBadges] = useState<ReturnType<typeof badgesPromise> | null>(null);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  useEffect(() => {
    statsPromiseRef.current = statsPromise;
    badgesPromiseRef.current = badgesPromise;
  }, [badgesPromise, statsPromise]);

  useEffect(() => {
    if (!user?.uid) return;
    setResolvedStats(statsPromiseRef.current(user.uid));
    setResolvedBadges(badgesPromiseRef.current(user.uid));
  }, [user?.uid]);

  if (isHydrating) return <ProfileHeaderSkeleton />;
  if (!user) return null;

  const fullName = `${user.profile?.firstName ?? ""} ${user.profile?.lastName ?? ""}`.trim();
  const profileName = fullName || user.displayName || "Usuario";
  const username = user.profile?.username || user.displayName || "usuario";
  const isCreator = user.profile?.participation === "creator";
  const creatorVerified = user.profile?.creatorVerified === true;

  const openEditProfile = () => {
    onSelectSectionSetting("edit-profile");
    onOpenSettings(true);
  };

  const sendVerification = async () => {
    setIsVerifyingEmail(true);
    setVerificationMessage(null);
    try {
      await authService.sendEmailVerification();
      setVerificationMessage("Email de verificacion enviado. Revisa tu bandeja de entrada.");
    } catch {
      setVerificationMessage("No se pudo enviar el email de verificacion.");
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  return (
    <section aria-label="Perfil de usuario" className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <ProfileBanner bannerUrl={user.profile?.bannerUrl} editable uid={user.uid}>
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openEditProfile} className="bg-white/85">
              Editar perfil
            </Button>
            <ShareProfileButton username={username} variant="icon" />
          </div>
        </ProfileBanner>

        <div className="px-4 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-12 mb-4 flex items-end justify-between sm:-mt-14">
            <div className="relative">
              <ProfileAvatar
                src={user.profile?.photoURL ?? user.photoURL}
                alt={`Foto de perfil de ${profileName}`}
                name={profileName}
                sizes="(max-width: 640px) 88px, 104px"
                loading="eager"
                className="h-[88px] w-[88px] bg-background ring-[3px] ring-card sm:h-[104px] sm:w-[104px]"
                textClassName="text-2xl sm:text-3xl"
              />
              {creatorVerified && (
                <BadgeCheck
                  className="absolute -bottom-1 -right-1 size-7 fill-primary text-white"
                  aria-label="Creador verificado por QHPA"
                />
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{profileName}</h1>
              <p className="text-sm text-muted-foreground">@{username}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {isCreator && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                  <Award className="size-3.5" aria-hidden />
                  Creador
                </span>
              )}
              {creatorVerified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                  <BadgeCheck className="size-3.5" aria-hidden />
                  Verificado por QHPA
                </span>
              )}
            </div>

            {user.profile?.bio ? (
              <div className="max-w-2xl border-l-2 border-primary/60 pl-4">
                <p className="text-sm leading-7 text-foreground/80">{user.profile.bio}</p>
              </div>
            ) : (
              <button type="button" onClick={openEditProfile} className="text-sm text-muted-foreground hover:underline">
                Agrega una biografía sobre ti
              </button>
            )}

            {user.profile?.website && (
              <a
                href={user.profile.website}
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

        {resolvedStats && (
          <div className="border-t border-border">
            <Suspense fallback={<StatsSkeleton />}>
              <ProfileStats statsPromise={resolvedStats} />
            </Suspense>
          </div>
        )}

        {resolvedBadges && (
          <div className="border-t border-border px-4 py-4 sm:px-6">
            <Suspense fallback={<BadgesSkeleton />}>
              <BadgesPreview badgesPromise={resolvedBadges} />
            </Suspense>
          </div>
        )}
      </div>

      {!user.emailVerified && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
            <div>
              <h2 className="font-semibold text-amber-900">Verifica tu correo electronico</h2>
              <p className="mt-1 text-sm text-amber-800">Necesitas verificarlo para proteger tu cuenta.</p>
              <Button size="sm" onClick={sendVerification} disabled={isVerifyingEmail} className="mt-3 bg-amber-600 text-white hover:bg-amber-700">
                {isVerifyingEmail ? <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden /> : <Mail className="mr-2 size-3.5" aria-hidden />}
                Enviar verificacion
              </Button>
              {verificationMessage && <p className="mt-2 text-xs text-amber-800">{verificationMessage}</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

function BadgesPreview({ badgesPromise }: { badgesPromise: Promise<UserBadge[]> }) {
  const badges = use(badgesPromise);

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase text-muted-foreground">Insignias</p>
      {badges.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aun no hay insignias.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span key={badge.id} title={badge.description} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium">
              <span aria-hidden>{badge.icon ?? "*"}</span>
              {badge.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function StatsSkeleton() {
  return <div className="h-20 animate-pulse bg-muted/40" />;
}

function BadgesSkeleton() {
  return <div className="h-12 animate-pulse rounded bg-muted/40" />;
}

function ProfileHeaderSkeleton() {
  return <div className="h-96 animate-pulse rounded-2xl border border-border bg-muted/40" />;
}
